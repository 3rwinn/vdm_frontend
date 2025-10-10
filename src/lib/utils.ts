import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to replace "/" in string by ":" in all occurence in the string
// Example: "08/12/2025" -> "08:12:2025"
export function replaceSlashByColon(str: string) {
  return str.replaceAll("/", ":");
}

// Function to replace "/" in string based on the position of the ":" and the number of ":" in the string
// Example: "36/18/56/20" => "36j 18h 56m 20s", "18/56/20" => "18h 56m 20s", "56/20" => "56m 20s", "20" => "20s"
export function replaceSlashByLabel(str: string) {
  const numSlashes = (str?.toString()?.match(/\//g) || []).length;
  if (numSlashes === 3) {
    return `${str.split("/")[0]}j ${str.split("/")[1]}h ${str.split("/")[2]}m ${
      str.split("/")[3]
    }s`;
  } else if (numSlashes === 2) {
    return `${str.split("/")[0]}h ${str.split("/")[1]}m ${str.split("/")[2]}s`;
  } else if (numSlashes === 1) {
    return `${str.split("/")[0]}m ${str.split("/")[1]}s`;
  } else {
    return str;
  }
}

export function replaceColonBySlashandConvert(str: string) {
  const replacedStr = str.replaceAll(":", "/");

  const convertedStr = replaceSlashByLabel(replacedStr);

  return convertedStr;
}

// Function that calculate the difference between two strings in the format "36/18/56/20"
export function calculateDifference(str1: string, str2: string) {
  const numSlashes1 = (str1?.toString()?.match(/\//g) || []).length;
  const numSlashes2 = (str2?.toString()?.match(/\//g) || []).length;
  if (numSlashes1 === 3 && numSlashes2 === 3) {
    const [j1, h1, m1, s1] = str1.split("/").map(Number);
    const [j2, h2, m2, s2] = str2.split("/").map(Number);
    return `${j1 - j2}j ${h1 - h2}h ${m1 - m2}m ${s1 - s2}s`;
  } else if (numSlashes1 === 2 && numSlashes2 === 2) {
    const [h1, m1, s1] = str1.split("/").map(Number);
    const [h2, m2, s2] = str2.split("/").map(Number);
    return `${h1 - h2}h ${m1 - m2}m ${s1 - s2}s`;
  } else if (numSlashes1 === 1 && numSlashes2 === 1) {
    const [m1, s1] = str1.split("/").map(Number);
    const [m2, s2] = str2.split("/").map(Number);
    return `${m1 - m2}m ${s1 - s2}s`;
  } else {
    // Fallback: try to parse as numbers and subtract, otherwise return as string
    const n1 = Number(str1);
    const n2 = Number(str2);
    if (!isNaN(n1) && !isNaN(n2)) {
      return `${n1 - n2}s`;
    }
    return str1;
  }
}

/* 
Function to convert this data structure:
"time_slot_metrics": {
        "spot_key": [
            "00H-05H",
            "05H-10H",
            "10H-13H",
            "13H-17H",
            "17H-20H",
            "20H-24H"
        ],
        "spot_count": [
            19,
            80,
            191,
            118,
            218,
            137
        ],
        "valorization": [
            0,
            0,
            0,
            0,
            0,
            0
        ]
    },

    into this data structure:
    [
      { heure: "00H-05H", spots: 186 },
      { heure: "10H-13H", spots: 237 },
      { heure: "13H-17H", spots: 73 },
      { heure: "17H-20H", spots: 209 },
      { heure: "20H-24H", spots: 214 },
    ]
*/
export function convertTimeSlotMetricsToChartData(timeSlotMetrics: any) {
  const heures = Array.isArray(timeSlotMetrics?.spot_key)
    ? timeSlotMetrics.spot_key
    : [];
  const spots = Array.isArray(timeSlotMetrics?.spot_count)
    ? timeSlotMetrics.spot_count
    : [];

  if (heures.length === 0 || spots.length === 0) {
    return [];
  }

  const newdatas = heures.map((heure: any, index: number) => ({
    heure: heure,
    spots: spots[index] ?? 0,
  }));

  console.log("new alpha", newdatas);

  return newdatas;
}

export function convertTimeValorizationMetricsToChartData(
  timeSlotMetrics: any
) {
  const heures = Array.isArray(timeSlotMetrics?.spot_key)
    ? timeSlotMetrics.spot_key
    : [];
  const spots = Array.isArray(timeSlotMetrics?.valorization)
    ? timeSlotMetrics.spot_count
    : [];

  if (heures.length === 0 || spots.length === 0) {
    return [];
  }

  const newdatas = heures.map((heure: any, index: number) => ({
    heure: heure,
    spots: spots[index] ?? 0,
  }));

  console.log("new alpha", newdatas);

  return newdatas;
}

export function convertDailyMetricsToChartData(dailyMetrics: any) {
  const jours = Array.isArray(dailyMetrics?.date) ? dailyMetrics.date : [];
  const spots = Array.isArray(dailyMetrics?.spot_count)
    ? dailyMetrics.spot_count
    : [];

  if (jours.length === 0 || spots.length === 0) {
    return [];
  }

  const newdatas = jours.map((jour: any, index: number) => ({
    jour: jour,
    spots: spots[index] ?? 0,
  }));

  return newdatas;
}

export function convertSectorDailyMetricsToChartData(dailyMetrics: any) {
  const jours = Array.isArray(dailyMetrics?.date) ? dailyMetrics.date : [];
  const spots = Array.isArray(dailyMetrics?.spots) ? dailyMetrics.spots : [];

  const valorisation = Array.isArray(dailyMetrics?.valorization)
    ? dailyMetrics.valorization
    : [];

  if (jours.length === 0 || spots.length === 0) {
    return [];
  }

  const newdatas = jours.map((jour: any, index: number) => ({
    jour: jour,
    spots: spots[index] ?? 0,
    valorisation: valorisation[index] ?? 0,
  }));

  return newdatas;
}
