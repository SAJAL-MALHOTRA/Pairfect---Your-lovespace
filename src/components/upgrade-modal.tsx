"use client";

import React from "react";
import PlusPaywallModal from "@/components/plus-paywall-modal";

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  description?: string;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  featureName,
  description,
}: UpgradeModalProps) {
  return (
    <PlusPaywallModal
      isOpen={isOpen}
      onClose={onClose}
      featureTitle={featureName ? `Unlock ${featureName}` : undefined}
      featureDescription={description}
    />
  );
}
