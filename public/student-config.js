const STUDENT_DATA = {
    planning: [
        {
            name: "Weekly Schedule",
            link: "schedule/schedule.pdf",
            action: "PDF"
        },
        {
            name: "Upcoming Dates",
            link: "#",
            action: "VIEW"
        },
        {
            name: "Grade Dashboard",
            link: "grades.html",
            action: "VIEW"
        }
    ],
    gradingSchemes: {
        "MTHE 281": {
            // Option 1 & 2 logic would be handled in a more advanced calculator.
            // For now, listing the components for the Grade Dashboard.
            components: [
                { name: "Homework", weight: 10, count: 10, score: null },
                { name: "Midterm 1", weight: 25, count: 1, score: null },
                { name: "Midterm 2", weight: 25, count: 1, score: null },
                { name: "Final Exam", weight: 40, count: 1, score: null }
            ]
        },
        "ENPH 239": {
            components: [
                { name: "Math Diagnostics", weight: 5, count: 1, score: null },
                { name: "Weekly Quizzes", weight: 15, count: 12, score: null },
                { name: "Assignments", weight: 40, count: 3, score: null },
                { name: "Final Exam", weight: 40, count: 1, score: null }
            ]
        },
        "MTHE 212": {
            components: [
                { name: "Quizzes", weight: 40, count: 5, dropLowest: 1, score: null },
                { name: "Final Exam", weight: 60, count: 1, score: null }
            ]
        },
        "CMPE 212": {
            components: [
                { name: "Lab 1", weight: 5, score: null },
                { name: "Lab 2", weight: 5, score: null },
                { name: "Lab 3", weight: 5, score: null },
                { name: "Lab 4", weight: 5, score: null },
                { name: "Lab 5", weight: 5, score: null },
                { name: "Lab 6", weight: 5, score: null },
                { name: "Lab 7", weight: 5, score: null },
                { name: "Lab 8", weight: 5, score: null },
                { name: "Test 1", weight: 15, score: null },
                { name: "Test 2", weight: 15, score: null },
                { name: "Final Exam", weight: 30, score: null } // Adjusted to 30 to sum to 100 based on syllabus md
            ]
        },
        "ELEC 274": {
            components: [
                { name: "Laboratories", weight: 20, count: 4, score: null },
                { name: "Midterm Quiz", weight: 20, count: 1, score: null },
                { name: "Final Exam", weight: 60, count: 1, score: null }
            ]
        }
    },
    courses: [
        {
            code: "MTHE 281",
            name: "Introduction To Real Analysis",
            notes: "pdfs/MTHE281.pdf",
            textbook: "textbooks/MTHE 281 Abbott - Understanding Analysis.pdf",
            solutions: "textbooks/MTHE 281 Understanding Analysis Solutions.pdf",
            assignments: "assignments.html?course=MTHE 281",
            onq: "https://onq.queensu.ca/d2l/home/1130523",
            notebooklm: "https://notebooklm.google.com/notebook/894bb5b3-43f0-49f3-b5b8-113225096c1d",
            drive: "https://drive.google.com/drive/folders/1sEaEGkjDQUFEEoIOZYq2CvajdVoQ__5a?usp=drive_link"
        },
        {
            code: "ENPH 239",
            name: "Electromagnetism",
            notes: "pdfs/ENPH239.pdf",
            textbook: "textbooks/ENPH 239 David J. Griffiths-Introduction to Electrodynamics-Addison-Wesley (2012).pdf",
            solutions: "textbooks/ENPH 239 solutions_manual.pdf",
            assignments: "assignments.html?course=ENPH 239",
            onq: "https://onq.queensu.ca/d2l/home/1130508",
            notebooklm: "https://notebooklm.google.com/notebook/856b7ce1-1f78-4a4b-bbb7-ab9230610df5",
            drive: "https://drive.google.com/drive/folders/11-W80eQ7-Ag0u8xNmLJq-6BAf2dNW_vZ?usp=drive_link"
        },
        {
            code: "MTHE 212",
            name: "Linear Algebra II",
            notes: "pdfs/MTHE212.pdf",
            textbook: "textbooks/LADR4e.pdf",
            solutions: "textbooks/MTHE212-Textbook-Solutions.pdf",
            assignments: "assignments.html?course=MTHE 212",
            onq: "https://onq.queensu.ca/d2l/home/1130003",
            notebooklm: "https://notebooklm.google.com/notebook/96203b28-07aa-43d9-ba8f-8324dacc56b5",
            drive: "https://drive.google.com/drive/folders/1DBAs6w3QF5w-jAk0cjVa2PrlGlFVbf6q?usp=drive_link"
        },
        {
            code: "CMPE 212",
            name: "Intro Computing Science II",
            notes: "pdfs/CMPE212.pdf",
            textbook: "textbooks/CMPE 212 Textbook - [5th ed.] Addison Wesley - Absolute Java.pdf",
            assignments: "assignments.html?course=CMPE 212",
            onq: "https://onq.queensu.ca/d2l/home/1130608",
            notebooklm: "https://notebooklm.google.com/notebook/8a81d398-0c92-45bf-b33f-d2667b198323",
            drive: "https://drive.google.com/drive/folders/1Yj2IemjtlGUBS6YdEiGR5_TATwFrzLbP?usp=drive_link"
        },
        {
            code: "ELEC 274",
            name: "Computer Architecture",
            notes: "pdfs/ELEC274.pdf",
            textbook: "textbooks/ELEC 274 Textbook - [6th ed.] Computer Organization and Embedded Systems by ya boi Manjikian himself.pdf",
            assignments: "assignments.html?course=ELEC 274",
            onq: "https://onq.queensu.ca/d2l/home/1130305",
            notebooklm: "https://notebooklm.google.com/notebook/d320a283-a332-4f3a-985c-e05a4e9adf8d",
            drive: "https://drive.google.com/drive/folders/18hRjBCfHPG9dYJZtIe90QOIaV_9aakBz?usp=drive_link"
        }
    ],
    assignments: [
        // --- CMPE 212 ---
        { id: "cmpe-l1", course: "CMPE 212", category: "LAB", title: "Lab 1", date: "2026-01-13", time: "14:30", status: "PENDING", score: null, details: { type: "text", content: "Comp Sci Lab 1" } },
        { id: "cmpe-l2", course: "CMPE 212", category: "LAB", title: "Lab 2", date: "2026-01-20", time: "14:30", status: "PENDING", score: null, details: { type: "text", content: "Comp Sci Lab 2" } },
        { id: "cmpe-l3", course: "CMPE 212", category: "LAB", title: "Lab 3", date: "2026-01-27", time: "14:30", status: "PENDING", score: null, details: { type: "text", content: "Comp Sci Lab 3" } },
        { id: "cmpe-t1", course: "CMPE 212", category: "MIDTERM", title: "Test 1", date: "2026-02-05", time: "09:30", status: "UPCOMING", score: null, details: { type: "text", content: "Midterm Test 1" } },
        { id: "cmpe-l4", course: "CMPE 212", category: "LAB", title: "Lab 4", date: "2026-02-10", time: "14:30", status: "PENDING", score: null, details: { type: "text", content: "Comp Sci Lab 4" } },
        // Reading Week Feb 13-22
        { id: "cmpe-l5", course: "CMPE 212", category: "LAB", title: "Lab 5", date: "2026-02-24", time: "14:30", status: "PENDING", score: null, details: { type: "text", content: "Comp Sci Lab 5" } },
        { id: "cmpe-l6", course: "CMPE 212", category: "LAB", title: "Lab 6", date: "2026-03-10", time: "14:30", status: "PENDING", score: null, details: { type: "text", content: "Comp Sci Lab 6" } },
        { id: "cmpe-t2", course: "CMPE 212", category: "MIDTERM", title: "Test 2", date: "2026-03-12", time: "09:30", status: "UPCOMING", score: null, details: { type: "text", content: "Midterm Test 2" } },
        { id: "cmpe-l7", course: "CMPE 212", category: "LAB", title: "Lab 7", date: "2026-03-17", time: "14:30", status: "PENDING", score: null, details: { type: "text", content: "Comp Sci Lab 7" } },
        { id: "cmpe-l8", course: "CMPE 212", category: "LAB", title: "Lab 8", date: "2026-03-31", time: "14:30", status: "PENDING", score: null, details: { type: "text", content: "Comp Sci Lab 8" } },
        { id: "cmpe-fin", course: "CMPE 212", category: "FINAL", title: "Final Exam", date: "2026-04-30", time: "00:00", status: "UPCOMING", score: null, details: { type: "text", content: "Date TBD" } },

        // --- ELEC 274 ---
        { id: "elec-l1", course: "ELEC 274", category: "LAB", title: "Lab 1", date: "2026-01-12", time: "18:30", status: "PENDING", score: null, details: { type: "text", content: "Week 2 Lab" } },
        { id: "elec-l2", course: "ELEC 274", category: "LAB", title: "Lab 2", date: "2026-01-26", time: "18:30", status: "PENDING", score: null, details: { type: "text", content: "Week 4 Lab" } },
        { id: "elec-t1", course: "ELEC 274", category: "MIDTERM", title: "Midterm Quiz", date: "2026-02-06", time: "13:30", status: "UPCOMING", score: null, details: { type: "text", content: "Friday, Feb 6 @ 1:30PM" } },
        { id: "elec-l3", course: "ELEC 274", category: "LAB", title: "Lab 3", date: "2026-03-09", time: "18:30", status: "PENDING", score: null, details: { type: "text", content: "Week 9 Lab" } },
        { id: "elec-l4", course: "ELEC 274", category: "LAB", title: "Lab 4", date: "2026-03-23", time: "18:30", status: "PENDING", score: null, details: { type: "text", content: "Week 11 Lab" } },
        { id: "elec-fin", course: "ELEC 274", category: "FINAL", title: "Final Exam", date: "2026-04-30", time: "00:00", status: "UPCOMING", score: null, details: { type: "text", content: "Date TBD" } },

        // --- OTHER COURSES (Retained) ---
        // --- MTHE 281 ---
        { id: "mthe281-h1", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 1", date: "2026-01-16", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h2", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 2", date: "2026-01-23", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h3", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 3", date: "2026-01-30", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h4", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 4", date: "2026-02-06", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },

        { id: "mthe281-m1", course: "MTHE 281", category: "MIDTERM", title: "Midterm 1", date: "2026-02-11", time: "13:30", status: "UPCOMING", score: null, details: { type: "text", content: "No calculators allowed." } },

        // Skip Week of Feb 9 (Midterm) -> No Fri Feb 13 HW
        // Skip Week of Feb 16 (Reading Week) -> No Fri Feb 20 HW

        { id: "mthe281-h5", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 5", date: "2026-02-27", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h6", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 6", date: "2026-03-06", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h7", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 7", date: "2026-03-13", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },

        { id: "mthe281-m2", course: "MTHE 281", category: "MIDTERM", title: "Midterm 2", date: "2026-03-18", time: "13:30", status: "UPCOMING", score: null, details: { type: "text", content: "No calculators allowed." } },

        // Skip Week of Mar 16 (Midterm) -> No Fri Mar 20 HW

        { id: "mthe281-h8", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 8", date: "2026-03-27", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h9", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 9", date: "2026-04-03", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h10", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 10", date: "2026-04-10", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } }, // Tentative date
        // --- MTHE 212 ---
        { id: "mthe212-q1", course: "MTHE 212", category: "QUIZ", title: "Quiz 1", date: "2026-01-23", time: "10:30", status: "UPCOMING", score: null, details: { type: "text", content: "In-class quiz (50 mins)." } },
        { id: "mthe212-q2", course: "MTHE 212", category: "QUIZ", title: "Quiz 2", date: "2026-02-06", time: "10:30", status: "UPCOMING", score: null, details: { type: "text", content: "In-class quiz (50 mins)." } },
        { id: "mthe212-q3", course: "MTHE 212", category: "QUIZ", title: "Quiz 3", date: "2026-02-27", time: "10:30", status: "UPCOMING", score: null, details: { type: "text", content: "In-class quiz (50 mins)." } },
        { id: "mthe212-q4", course: "MTHE 212", category: "QUIZ", title: "Quiz 4", date: "2026-03-13", time: "10:30", status: "UPCOMING", score: null, details: { type: "text", content: "In-class quiz (50 mins)." } },
        { id: "mthe212-q5", course: "MTHE 212", category: "QUIZ", title: "Quiz 5", date: "2026-03-27", time: "10:30", status: "UPCOMING", score: null, details: { type: "text", content: "In-class quiz (50 mins)." } },

        // --- ENPH 239 ---
        { id: "enph239-diag", course: "ENPH 239", category: "QUIZ", title: "Math Diagnostics", date: "2026-01-16", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Post-diagnostics quiz on OnQ (5%)." } },

        // Assignments (Weeks 5, 8, 11)
        { id: "enph239-a1", course: "ENPH 239", category: "ASSIGNMENT", title: "Assignment 1", date: "2026-02-06", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/ENPH239.pdf" } },
        { id: "enph239-a2", course: "ENPH 239", category: "ASSIGNMENT", title: "Assignment 2", date: "2026-03-06", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/ENPH239.pdf" } },
        { id: "enph239-a3", course: "ENPH 239", category: "ASSIGNMENT", title: "Assignment 3", date: "2026-03-27", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/ENPH239.pdf" } },

        // Weekly Quizzes (12)
        { id: "enph239-q1", course: "ENPH 239", category: "QUIZ", title: "Weekly Quiz 1", date: "2026-01-09", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "OnQ Quiz" } },
        { id: "enph239-q2", course: "ENPH 239", category: "QUIZ", title: "Weekly Quiz 2", date: "2026-01-16", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "OnQ Quiz" } },
        { id: "enph239-q3", course: "ENPH 239", category: "QUIZ", title: "Weekly Quiz 3", date: "2026-01-23", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "OnQ Quiz" } },
        { id: "enph239-q4", course: "ENPH 239", category: "QUIZ", title: "Weekly Quiz 4", date: "2026-01-30", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "OnQ Quiz" } },
        { id: "enph239-q5", course: "ENPH 239", category: "QUIZ", title: "Weekly Quiz 5", date: "2026-02-06", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "OnQ Quiz" } },
        { id: "enph239-q6", course: "ENPH 239", category: "QUIZ", title: "Weekly Quiz 6", date: "2026-02-13", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "OnQ Quiz" } },
        // Reading Week Feb 16-22
        { id: "enph239-q7", course: "ENPH 239", category: "QUIZ", title: "Weekly Quiz 7", date: "2026-02-27", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "OnQ Quiz" } },
        { id: "enph239-q8", course: "ENPH 239", category: "QUIZ", title: "Weekly Quiz 8", date: "2026-03-06", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "OnQ Quiz" } },
        { id: "enph239-q9", course: "ENPH 239", category: "QUIZ", title: "Weekly Quiz 9", date: "2026-03-13", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "OnQ Quiz" } },
        { id: "enph239-q10", course: "ENPH 239", category: "QUIZ", title: "Weekly Quiz 10", date: "2026-03-20", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "OnQ Quiz" } },
        { id: "enph239-q11", course: "ENPH 239", category: "QUIZ", title: "Weekly Quiz 11", date: "2026-03-27", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "OnQ Quiz" } },
        { id: "enph239-q12", course: "ENPH 239", category: "QUIZ", title: "Weekly Quiz 12", date: "2026-04-03", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "OnQ Quiz" } },
        { id: "enph239-fin", course: "ENPH 239", category: "FINAL", title: "Final Exam", date: "2026-04-30", time: "00:00", status: "UPCOMING", score: null, details: { type: "text", content: "Date TBD" } },

        // Removed ELEC 274 Feb 5 Midterm as it conflicted with the Feb 6 one.
        {
            id: "6",
            course: "PERSONAL",
            category: "REMINDER",
            title: "Rent Payment",
            date: "2026-02-01",
            time: "09:00",
            status: "PENDING",
            score: null,
            details: { type: "text", content: "Pay $850 to Landlord via E-Transfer." }
        },
        {
            id: "tuition-w26",
            course: "FINANCE",
            category: "REMINDER",
            title: "Pay Tuition",
            date: "2026-01-10",
            time: "10:00",
            status: "PENDING",
            score: null,
            details: { type: "text", content: "Pay Winter 2026 Tuition via Online Banking." }
        },
        {
            id: "7",
            course: "CAREER",
            category: "REMINDER",
            title: "RBC Internship Application",
            date: "2026-01-19",
            time: "23:59",
            status: "PENDING",
            score: null,
            details: { type: "link", url: "https://jobs.rbc.com", label: "Apply Here" }
        }
    ]
};
