"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { cn } from "@utils/cn";

interface PersonalInfoSectionProps {
  user?: {
    name?: string;
    email?: string;
  };
  bio?: string;
}

export const PersonalInfoSection = ({ user, bio = "" }: PersonalInfoSectionProps) => {
  const [bioText, setBioText] = useState(bio);

  const MAX_BIO_LENGTH = 100;
  const isLimitReached = bioText.length >= MAX_BIO_LENGTH;

  return (
    <Card className="rounded-2xl border-slate-100 bg-white shadow-sm">
      <CardHeader className="pb-5">
        <CardTitle className="text-base font-semibold text-slate-900">
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="full-name" className="text-xs font-medium text-slate-600">
              Full Name
            </Label>
            <Input
              id="full-name"
              type="text"
              defaultValue={user?.name || ""}
              className="rounded-xl border-slate-200 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email-address" className="text-xs font-medium text-slate-600">
              Email Address
            </Label>
            <Input
              id="email-address"
              type="email"
              defaultValue={user?.email || ""}
              className="rounded-xl border-slate-200 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex h-4 items-center justify-between">
            <Label htmlFor="bio" className="text-xs font-medium text-slate-600">
              Bio
            </Label>
            {isLimitReached && (
              <span className="text-[11px] font-medium tracking-wide text-blue-600">
                Maximum length reached
              </span>
            )}
          </div>

          <Textarea
            id="bio"
            rows={4}
            value={bioText}
            maxLength={MAX_BIO_LENGTH}
            onChange={(e) => setBioText(e.target.value)}
            className={cn(
              "resize-none rounded-xl border-slate-200 transition-all duration-200 focus-visible:border-blue-500 focus-visible:ring-blue-500/20",
              isLimitReached && [
                "border-blue-400 bg-blue-50/10",
                "focus-visible:border-blue-500 focus-visible:ring-blue-500/20",
              ],
            )}
          />

          <p
            className={cn(
              "text-right text-[11px] transition-colors duration-200",
              isLimitReached ? "font-semibold text-blue-600" : "text-slate-400",
            )}
          >
            {bioText.length}/{MAX_BIO_LENGTH}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
