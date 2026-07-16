export interface AnalysisResult {
  trustScore: number;
  verdict: "Likely Safe" | "Suspicious" | "Likely Scam";
  redFlags: string[];
  explanation: string;
  recommendedAction: string;
}
