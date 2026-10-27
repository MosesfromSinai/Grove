"use client";

export function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read this image. Try a different file."));
    reader.onload = () => {
      if (typeof reader.result !== "string") return reject(new Error("Could not read this image."));
      const value = reader.result;
      const image = new window.Image();
      image.onload = () => resolve(value);
      image.onerror = () => reject(new Error("This file is not a readable image. Choose a JPG, PNG, or WebP."));
      image.src = value;
    };
    reader.readAsDataURL(file);
  });
}
