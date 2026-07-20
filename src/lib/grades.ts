// Best to worst. Ungraded ranks worst deliberately: grade is a choice made
// in the moment at batch-logging time, not something that takes time to
// come back like an EUDR check — if Ungraded couldn't drag a lot's
// blended_grade down, there'd be no cost to skipping grading, and the
// field would stop meaning anything.
export const GRADES = ["Grade I", "Grade II", "Grade III", "Ungraded"] as const;

export type Grade = (typeof GRADES)[number];

export function worstGrade(grades: Grade[]): Grade {
  return grades.reduce((worst, grade) =>
    GRADES.indexOf(grade) > GRADES.indexOf(worst) ? grade : worst,
  );
}
