import React from "react";
import Navbar from "../page_components/Navbar/Navbar";
import VerificationButtons from "../page_components/Verification/VerificationButtons";

export default function Verification() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#1e3a8a_0%,_#4f378b_60%,_#6d28d9_100%)]">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen pt-20">
        <VerificationButtons />
      </div>
    </div>
  );
}
