import { extractPdfText } from "./pdf";
import { extractDocxText } from "./docx";
import type { FileType } from "@/types/database";

export async function extractText(
  buffer: Buffer,
  fileType: FileType
): Promise<string> {
  switch (fileType) {
    case "pdf":
      return extractPdfText(buffer);
    case "docx":
      return extractDocxText(buffer);
    case "text":
      return buffer.toString("utf-8");
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

const ALLOWED_TYPES: Record<string, FileType> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function validateFile(file: File): { fileType: FileType; error?: string } {
  const fileType = ALLOWED_TYPES[file.type];
  if (!fileType) {
    return { fileType: "text", error: "Only PDF and DOCX files are supported" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { fileType, error: "File size must be under 10 MB" };
  }
  return { fileType };
}
