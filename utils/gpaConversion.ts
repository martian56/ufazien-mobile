// GPA Conversion Utilities
import { Colors, PrimaryBlue } from '@/constants/theme';

export interface ConversionTableEntry {
  min: number;
  max: number;
  gpa: number;
  letter: string;
  status: string;
  azMin: number;
  azMax: number;
}

export const ufazConversionTable: ConversionTableEntry[] = [
  { min: 16, max: 20, gpa: 4.0, letter: 'A+', status: 'Perfect', azMin: 90, azMax: 100 },
  { min: 13.5, max: 16, gpa: 4.0, letter: 'A', status: 'Excellent', azMin: 80, azMax: 90 },
  { min: 11.5, max: 13.5, gpa: 3.0, letter: 'B', status: 'Good', azMin: 70, azMax: 80 },
  { min: 10, max: 11.5, gpa: 2.0, letter: 'C', status: 'Enough', azMin: 50, azMax: 70 },
  { min: 0, max: 10, gpa: 0.0, letter: 'F', status: 'Fail', azMin: 0, azMax: 50 },
];

export interface GPAConversionResult {
  gpa: number;
  letter: string;
  status: string;
  azerbaijanEquivalent: number;
}

export const convertUFAZToGPA = (average: number): GPAConversionResult => {
  if (average >= 16 && average <= 20) {
    return { gpa: 4.0, letter: 'A+', status: 'Perfect', azerbaijanEquivalent: 95 };
  } else if (average >= 13.5 && average < 16) {
    return { gpa: 4.0, letter: 'A', status: 'Excellent', azerbaijanEquivalent: 85 };
  } else if (average >= 11.5 && average < 13.5) {
    // Linear interpolation for Good range (11.5-13.5)
    const gpaPoints = 3.0 + ((average - 11.5) / 2.0) * 0.7;
    const azerbaijanEquivalent = 70 + ((average - 11.5) / 2.0) * 10;
    let letter = 'B+';
    if (average < 12.5) letter = 'B';
    return {
      gpa: Math.round(gpaPoints * 1000) / 1000,
      letter,
      status: 'Good',
      azerbaijanEquivalent: Math.round(azerbaijanEquivalent * 10) / 10,
    };
  } else if (average >= 10 && average < 11.5) {
    // Linear interpolation for Enough range (10-11.5)
    const gpaPoints = 2.0 + ((average - 10) / 1.5) * 1.0;
    const azerbaijanEquivalent = 50 + ((average - 10) / 1.5) * 20;
    let letter = 'C+';
    if (average < 10.75) letter = 'C';
    return {
      gpa: Math.round(gpaPoints * 1000) / 1000,
      letter,
      status: 'Enough',
      azerbaijanEquivalent: Math.round(azerbaijanEquivalent * 10) / 10,
    };
  } else {
    return { gpa: 0.0, letter: 'F', status: 'Fail', azerbaijanEquivalent: 25 };
  }
};

export const convertAzerbaijanToGPA = (average: number): GPAConversionResult => {
  if (average >= 90 && average <= 100) {
    return { gpa: 4.0, letter: 'A', status: 'Excellent', azerbaijanEquivalent: average };
  } else if (average >= 80 && average < 90) {
    return { gpa: 3.7, letter: 'A-', status: 'Excellent', azerbaijanEquivalent: average };
  } else if (average >= 70 && average < 80) {
    return { gpa: 3.0, letter: 'B', status: 'Good', azerbaijanEquivalent: average };
  } else if (average >= 60 && average < 70) {
    return { gpa: 2.7, letter: 'B-', status: 'Good', azerbaijanEquivalent: average };
  } else if (average >= 50 && average < 60) {
    return { gpa: 2.0, letter: 'C', status: 'Enough', azerbaijanEquivalent: average };
  } else {
    return { gpa: 0.0, letter: 'F', status: 'Fail', azerbaijanEquivalent: average };
  }
};

export const convertGPAToAzerbaijan = (gpa: number): number => {
  if (gpa >= 3.7) return 90;
  if (gpa >= 3.0) return 80;
  if (gpa >= 2.7) return 70;
  if (gpa >= 2.0) return 60;
  if (gpa >= 1.0) return 50;
  return 25;
};

export const getLetterGrade = (gpa: number): string => {
  if (gpa >= 4.0) return 'A+';
  if (gpa >= 3.7) return 'A';
  if (gpa >= 3.3) return 'A-';
  if (gpa >= 3.0) return 'B+';
  if (gpa >= 2.7) return 'B';
  if (gpa >= 2.3) return 'B-';
  if (gpa >= 2.0) return 'C+';
  if (gpa >= 1.7) return 'C';
  if (gpa >= 1.3) return 'C-';
  if (gpa >= 1.0) return 'D';
  return 'F';
};

export const getGPAStatus = (gpa: number): { label: string; color: string; bgColor: string } => {
  if (gpa >= 3.7)
    return {
      label: 'Excellent',
      color: Colors.light.success,
      bgColor: `${Colors.light.success}20`,
    };
  if (gpa >= 3.0) return { label: 'Good', color: PrimaryBlue, bgColor: `${PrimaryBlue}20` };
  if (gpa >= 2.0)
    return {
      label: 'Satisfactory',
      color: Colors.light.warning,
      bgColor: `${Colors.light.warning}20`,
    };
  if (gpa >= 1.0) return { label: 'Poor', color: '#F97316', bgColor: '#F9731620' };
  return { label: 'Failing', color: Colors.light.error, bgColor: `${Colors.light.error}20` };
};
