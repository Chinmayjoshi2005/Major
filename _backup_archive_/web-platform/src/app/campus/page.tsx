import { CampusExperience } from "@/features/explore/campus-experience";
import { Suspense } from "react";

export const metadata = {
  title: "Campus Experience | Campus Guide 3D",
};

export default function CampusPage() {
  return (
    <Suspense fallback={null}>
      <CampusExperience />
    </Suspense>
  );
}
