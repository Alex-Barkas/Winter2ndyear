// Historical + in-progress grade record, transcribed from the official
// Queen's transcript (printed 2026-08-23). Used only by the GPA calculator --
// this is a separate concern from the per-term assignment/grading-scheme data
// in winter2026.js/summer2026.js/fall2026.js, which tracks in-term component
// scores rather than final letter grades.
//
// Grade points follow Queen's 4.3 scale. Verified against every term on the
// transcript: units * points, summed and divided by units, reproduces each
// printed Term GPA exactly (e.g. 2026 Winter: 77.4 / 18.75 = 4.13).
export const GRADE_POINTS = {
    'A+': 4.3, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0,
};

// Standard 4.0-scale grade points (matches UofT's published scale, among
// other schools) for comparing against a plain out-of-4.0 GPA. Identical to
// the 4.3 scale above except A+ caps at 4.0 instead of 4.3 -- every other
// grade already sits at or below 4.0, so nothing else moves.
export const GRADE_POINTS_4 = {
    ...GRADE_POINTS,
    'A+': 4.0,
};

// `grade: null` means ungraded (in progress or not yet started) and is
// excluded from every GPA calculation -- it is NOT the same as a 0.
// `units: null` means the transcript doesn't list a credit weight yet
// (2026 Fall courses, still being finalized); the calculator page lets the
// user fill that in alongside the grade.
export const transcript = [
    {
        term: '2024-fall', label: '2024 Fall', status: 'complete',
        courses: [
            { code: 'APSC 101', name: 'Engineering Design & Practice', units: 3.20, grade: 'A-' },
            { code: 'APSC 102', name: 'Experimentation', units: 2.00, grade: 'A' },
            { code: 'APSC 111', name: 'Physics I', units: 3.30, grade: 'A-' },
            { code: 'APSC 131', name: 'Chemistry of Eng. Materials', units: 3.30, grade: 'A' },
            { code: 'APSC 141', name: 'Intro. Computer Programming 1', units: 1.00, grade: 'A' },
            { code: 'APSC 151', name: 'Earth Systems Engineering', units: 3.30, grade: 'B+' },
            { code: 'APSC 162', name: 'Engineering Graphics', units: 2.50, grade: 'A-' },
            { code: 'APSC 171', name: 'Calculus I', units: 3.30, grade: 'A' },
            { code: 'APSC 199', name: 'Engineering Communications 1', units: 0.50, grade: 'B+' },
        ],
    },
    {
        term: '2025-winter', label: '2025 Winter', status: 'complete',
        courses: [
            { code: 'APSC 103', name: 'Eng Client Based Design Proj', units: 3.50, grade: 'A' },
            { code: 'APSC 112', name: 'Physics II', units: 3.30, grade: 'B-' },
            { code: 'APSC 132', name: 'Chem of Natural & Eng Systems', units: 3.30, grade: 'B' },
            { code: 'APSC 142', name: 'Intro. Computer Programming 2', units: 2.30, grade: 'A-' },
            { code: 'APSC 172', name: 'Calculus II', units: 3.30, grade: 'A-' },
            { code: 'APSC 174', name: 'Introduction To Linear Algebra', units: 3.30, grade: 'A+' },
            { code: 'APSC 182', name: 'Applied Engineering Mechanics', units: 1.70, grade: 'B+' },
        ],
    },
    {
        term: '2025-fall', label: '2025 Fall', status: 'complete',
        courses: [
            { code: 'APSC 200', name: 'Engr Design & Practice', units: 4.00, grade: 'A-' },
            { code: 'APSC 293', name: 'Engineering Communications 2', units: 1.00, grade: 'A-' },
            { code: 'MECH 221', name: 'Solid Mechanics I', units: 3.50, grade: 'A+' },
            { code: 'MREN 241', name: 'Fluid Mchncs & Fluid Pwr', units: 3.75, grade: 'A' },
            { code: 'MTHE 217', name: 'Algebraic Structures', units: 3.50, grade: 'A-' },
            { code: 'MTHE 237', name: 'Diff Equations for Eng Sci', units: 3.50, grade: 'B-' },
            { code: 'MTHE 280', name: 'Advanced Calculus', units: 3.50, grade: 'A' },
        ],
    },
    {
        term: '2026-winter', label: '2026 Winter', status: 'complete',
        courses: [
            { code: 'ENPH 225', name: 'Mechanics', units: 3.50, grade: 'A+' },
            { code: 'MECH 210', name: 'Elec Circ & Mtrs for Mechatron', units: 4.50, grade: 'A+' },
            { code: 'MREN 230', name: 'Thermodyn & Heat Trnsfr', units: 3.75, grade: 'A' },
            { code: 'MTHE 212', name: 'Linear Algebra', units: 3.50, grade: 'A+' },
            { code: 'MTHE 281', name: 'Introduction To Real Analysis', units: 3.50, grade: 'A-' },
        ],
    },
    {
        term: '2026-summer', label: '2026 Summer', status: 'in-progress',
        courses: [
            { code: 'APSC 221', name: 'Economic and Business Practice', units: 3.00, grade: null },
        ],
    },
    {
        term: '2026-fall', label: '2026 Fall', status: 'upcoming',
        courses: [
            { code: 'MECH 321', name: 'Solid Mechanics II', units: null, grade: null },
            { code: 'MECH 328', name: 'Dynamics & Vibration', units: null, grade: null },
            { code: 'MECH 330', name: 'Applied Thermo II', units: null, grade: null },
            { code: 'MECH 398', name: 'Mechanical Eng Lab I', units: null, grade: null },
            { code: 'MTHE 326', name: 'Functs. Of A Complex Variable', units: null, grade: null },
            { code: 'MTHE 351', name: 'Probability I', units: null, grade: null },
        ],
    },
];
