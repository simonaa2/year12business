// ===================================================
// HSC BUSINESS STUDIES SCAFFOLD — CONFIGURATION
// ===================================================

const CONFIG = {
  // Google Apps Script Web App URL (from your setup):
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyw9A5ebny_YKLG0YC0IibSMV-lc44hyJh8j1aT8AW9T9rLhaolQCItEOPU-XQZ7I0iXA/exec',

  // App details:
  APP_TITLE:    'Year 12 Business Studies 2026',
  APP_SUBTITLE: 'Marketing (Role & Influences) — Research Scaffold',
  DUE_DATE:           '2026-08-10T09:00:00+10:00', // Portfolio Due: Monday Week 4 (3 weeks into Term 3)
  DUE_DATE_MARKETING: '2026-07-20T09:00:00+10:00', // Marketing Due: Monday Week 1 (End of holidays)

  // -----------------------------------------------
  // STUDENT ROSTER
  // Add each student as: { name: 'Full Name', password: 'password' }
  // Name must match exactly what they type on the login page.
  // Passwords can be anything — e.g. first name + last 2 digits of DOB.
  // Leave the array empty [] to use the old class-code system instead.
  // -----------------------------------------------
  STUDENTS: [
    { name: 'Simon Anderson',            password: 'simon835'   },
    { name: 'Austin Crump',              password: 'austin274'  },
    { name: 'Aidan Tresister',           password: 'aidan619'   },
    { name: 'Adam Avdalis',              password: 'adam482'    },
    { name: 'Zach Hull',                 password: 'zach903'    },
    { name: 'Lucas Helacas',             password: 'lucas516'   },
    { name: 'Seb Sacilotto',             password: 'seb738'     },
    { name: 'William Rebel',             password: 'william349' },
  ],

  // Fallback class code (only used if STUDENTS list is empty):
  CLASS_CODE: 'BUSN2026',

  // Teacher dashboard password:
  TEACHER_PASSWORD: 'teacher2026',
};
