// ===================================================
// HSC BUSINESS STUDIES SCAFFOLD — CONFIGURATION
// ===================================================

const CONFIG = {
  // Google Apps Script Web App URL (from your setup):
  SCRIPT_URL: 'YOUR_APPS_SCRIPT_URL_HERE',

  // App details:
  APP_TITLE:    'Year 12 Business Studies 2026',
  APP_SUBTITLE: 'Marketing (Role & Influences) — Research Scaffold',
  DUE_DATE:     '2026-07-20T09:00:00+10:00', // e.g. first Monday of Term 3

  // -----------------------------------------------
  // STUDENT ROSTER
  // Add each student as: { name: 'Full Name', password: 'password' }
  // Name must match exactly what they type on the login page.
  // Passwords can be anything — e.g. first name + last 2 digits of DOB.
  // Leave the array empty [] to use the old class-code system instead.
  // -----------------------------------------------
  STUDENTS: [
    { name: 'Simon Anderson',            password: 'simon12'   },
    { name: 'Student A',                 password: 'studenta'  },
    { name: 'Student B',                 password: 'studentb'  },
    { name: 'Student C',                 password: 'studentc'  },
    { name: 'Student D',                 password: 'studentd'  },
  ],

  // Fallback class code (only used if STUDENTS list is empty):
  CLASS_CODE: 'BUSN2026',

  // Teacher dashboard password:
  TEACHER_PASSWORD: 'teacher2026',
};
