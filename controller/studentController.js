import { createRequire } from "module";
import multer from "multer";
import { parse as parseCsvSync } from "csv-parse/sync";

const require = createRequire(import.meta.url);
const { supabase, supabaseAdmin } = require("../config/supabase.js");

// Setup multer to read CSV in-memory from multipart/form-data uploads
const upload = multer({ storage: multer.memoryStorage() });

// Helper to wrap multer.single in a promise for controller usage
const parseMultipart = (req, res) =>
  new Promise((resolve, reject) => {
    upload.single("file")(req, res, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

const REQUIRED_FIELDS = [
  "student_name",
  "student_email",
  "student_password",
  "student_phone_number",
  "student_course",
  "student_branch",
  "student_current_year",
  "student_semester",
  "student_year_of_admission",
];

function sanitizeRecord(rec) {
  if (!rec || typeof rec !== "object") return {};
  const out = {
    student_name: rec.student_name?.toString().trim() || "",
    student_email: rec.student_email?.toString().trim() || "",
    student_password: rec.student_password?.toString() || "",
    student_phone_number: rec.student_phone_number?.toString().trim() || null,
    student_profile_picture_key: rec.student_profile_picture_key?.toString().trim() || null,
    student_course: rec.student_course?.toString().trim() || null,
    student_branch: rec.student_branch?.toString().trim() || null,
    student_current_year: rec.student_current_year !== undefined && rec.student_current_year !== null
      ? Number(rec.student_current_year)
      : null,
    student_semester: rec.student_semester !== undefined && rec.student_semester !== null
      ? Number(rec.student_semester)
      : null,
    student_year_of_admission: rec.student_year_of_admission !== undefined && rec.student_year_of_admission !== null
      ? Number(rec.student_year_of_admission)
      : null,
  };
  return out;
}

// Re-introduce strong validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

function isStrongPassword(pw) {
  if (typeof pw !== "string" || pw.length < 8) return false;
  const lower = /[a-z]/.test(pw);
  const upper = /[A-Z]/.test(pw);
  const digit = /\d/.test(pw);
  return lower && upper && digit;
}

function isDigits(str) {
  return /^\d+$/.test(str);
}

function validateRecord(rec) {
  const errors = [];
  const missing = REQUIRED_FIELDS.filter((f) => rec[f] === undefined || rec[f] === null || rec[f] === "");
  if (missing.length) {
    errors.push(`Missing required field(s): ${missing.join(", ")}`);
  }

  if (rec.student_name && !rec.student_name.trim()) {
    errors.push("student_name must be a non-empty string");
  }

  if (rec.student_email && !isValidEmail(rec.student_email)) {
    errors.push("Invalid email format");
  }

  if (rec.student_password && !isStrongPassword(rec.student_password)) {
    errors.push("Password must be at least 8 chars and include upper, lower, and a digit");
  }

  if (rec.student_phone_number) {
    const digitsOnly = rec.student_phone_number.toString().replace(/[\s+\-()]/g, "");
    if (!isDigits(digitsOnly) || digitsOnly.length < 7 || digitsOnly.length > 15) {
      errors.push("student_phone_number must be 7-15 digits (you may include +, -, spaces, or parentheses)");
    }
  }

  if (rec.student_course && !rec.student_course.toString().trim()) {
    errors.push("student_course must be a non-empty string");
  }

  if (rec.student_branch && !rec.student_branch.toString().trim()) {
    errors.push("student_branch must be a non-empty string");
  }

  if (rec.student_current_year == null || !Number.isInteger(rec.student_current_year) || rec.student_current_year < 1 || rec.student_current_year > 8) {
    errors.push("student_current_year must be an integer between 1 and 8");
  }

  if (rec.student_semester == null || !Number.isInteger(rec.student_semester) || rec.student_semester < 1 || rec.student_semester > 16) {
    errors.push("student_semester must be an integer between 1 and 16");
  }

  if (rec.student_year_of_admission == null || !Number.isInteger(rec.student_year_of_admission) || rec.student_year_of_admission < 1900 || rec.student_year_of_admission > 2100) {
    errors.push("student_year_of_admission must be an integer between 1900 and 2100");
  }

  return errors.length ? errors.join("; ") : null;
}

async function createAuthUser({ name, email, password }) {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: name,
      role: "STUDENT",
    },
  });
  if (authError) throw authError;
  return authData.user;
}

async function insertStudentRow(studentData /* object with student_* fields */) {
  const { data, error } = await supabase
    .from("students")
    .insert([studentData])
    .select();
  if (error) throw error;
  return data?.[0] ?? null;
}

async function processRecord(raw) {
  const rec = sanitizeRecord(raw);
  const validationError = validateRecord(rec);
  if (validationError) {
    return { success: false, error: validationError };
  }

  // 1) Create auth user
  const user = await createAuthUser({
    name: rec.student_name,
    email: rec.student_email,
    password: rec.student_password,
  });

  // 2) Insert into public.students
  const toInsert = { ...rec, student_id: user.id };

  // Do not store password in students table
  delete toInsert.student_password;

  const inserted = await insertStudentRow(toInsert);
  return { success: true, userId: user.id, student: inserted };
}

function parseCsvBufferToRecords(buf) {
  const text = buf.toString("utf8");
  const records = parseCsvSync(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records;
}

export const createStudents = async (req, res) => {
  try {
    let records = [];
    const contentType = req.headers["content-type"] || "";

    if (contentType.includes("multipart/form-data")) {
      // CSV path via form-data upload with field name 'file'
      await parseMultipart(req, res);
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({
          success: false,
          message: "CSV file missing. Upload using form-data with field name 'file'",
        });
      }
      try {
        records = parseCsvBufferToRecords(req.file.buffer);
      } catch (e) {
        return res.status(400).json({ success: false, message: `CSV parse error: ${e.message}` });
      }
    } else {
      // JSON path: accept either an array or { students: [...] }
      const body = req.body;
      if (Array.isArray(body)) {
        records = body;
      } else if (body && Array.isArray(body.students)) {
        records = body.students;
      } else {
        return res.status(400).json({
          success: false,
          message: "Expected JSON array of students or object with 'students' array, or CSV via multipart/form-data",
        });
      }
    }

    if (!records.length) {
      return res.status(400).json({ success: false, message: "No student records provided" });
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < records.length; i++) {
      const raw = records[i];
      try {
        const result = await processRecord(raw);
        if (result.success) successCount += 1; else failureCount += 1;
        results.push({ index: i, ...result });
      } catch (err) {
        failureCount += 1;
        results.push({ index: i, success: false, error: err.message || "Unknown error" });
      }
    }

    const status = failureCount > 0 ? (successCount > 0 ? 207 : 400) : 201;
    return res.status(status).json({
      success: failureCount === 0,
      summary: {
        total: records.length,
        succeeded: successCount,
        failed: failureCount,
      },
      results,
    });
  } catch (error) {
    console.error("Error in createStudents:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

