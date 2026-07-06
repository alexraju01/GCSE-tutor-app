"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { X, ChevronDown } from "lucide-react";
import { TeachesSubject } from "../types/teacher";

interface TeachingInformationSectionProps {
	teaches?: TeachesSubject[];
}

const formatSubjectName = (rawSubject: string) => {
	if (!rawSubject) return "";
	return rawSubject
		.toLowerCase()
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};

export const TeachingInformationSection = ({ teaches = [] }: TeachingInformationSectionProps) => {
	const [subjects, setSubjects] = useState<TeachesSubject[]>(teaches);

	const removeSubject = (idToRemove: string) => {
		setSubjects(subjects.filter((sub) => sub.id !== idToRemove));
	};

	const groupedSubjects = Object.groupBy(subjects, (sub) => {
		const level = sub.level?.toUpperCase();
		if (level === "A_LEVEL" || level === "A_LEVELS") return "aLevel";
		if (level === "GCSE" || level === "GCSES") return "gcse";
		return "other";
	});

	// Access them safely in your JSX using optional chaining
	const gcseSubjects = groupedSubjects.gcse || [];
	const aLevelSubjects = groupedSubjects.aLevel || [];

	return (
		<Card className='border-slate-100 rounded-2xl shadow-sm bg-white'>
			<CardHeader className='pb-5'>
				<CardTitle className='text-base font-semibold text-slate-900'>
					Teaching Information
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-5'>
				{/* Subjects Grouped by Level */}
				<div className='space-y-4'>
					<Label className='text-xs font-medium text-slate-600 block'>Subjects You Teach</Label>

					{/* GCSE Nested Row */}
					<div className='space-y-1.5 pl-2 border-l-2 border-slate-100'>
						<span className='text-[11px] font-semibold uppercase tracking-wider text-slate-400 block'>
							GCSE Level
						</span>
						<div className='min-h-10 flex flex-wrap items-center gap-1.5 p-1.5 w-full border border-slate-200 rounded-xl bg-white relative pr-8'>
							{gcseSubjects.length === 0 ? (
								<span className='text-xs text-slate-400 px-1.5 py-1'>
									No GCSE subjects selected...
								</span>
							) : (
								gcseSubjects.map((sub) => (
									<span
										key={sub.id}
										className='inline-flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded-lg text-xs font-medium'>
										{formatSubjectName(sub.subject)}
										<X
											className='w-3 h-3 cursor-pointer hover:text-blue-800 transition-colors'
											onClick={() => removeSubject(sub.id)}
										/>
									</span>
								))
							)}
							<ChevronDown className='w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none' />
						</div>
					</div>

					{/* A-Level Nested Row */}
					<div className='space-y-1.5 pl-2 border-l-2 border-slate-100'>
						<span className='text-[11px] font-semibold uppercase tracking-wider text-slate-400 block'>
							A-Level
						</span>
						<div className='min-h-10 flex flex-wrap items-center gap-1.5 p-1.5 w-full border border-slate-200 rounded-xl bg-white relative pr-8'>
							{aLevelSubjects.length === 0 ? (
								<span className='text-xs text-slate-400 px-1.5 py-1'>
									No A-Level subjects selected...
								</span>
							) : (
								aLevelSubjects.map((sub) => (
									<span
										key={sub.id}
										className='inline-flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded-lg text-xs font-medium'>
										{formatSubjectName(sub.subject)}
										<X
											className='w-3 h-3 cursor-pointer hover:text-blue-800 transition-colors'
											onClick={() => removeSubject(sub.id)}
										/>
									</span>
								))
							)}
							<ChevronDown className='w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none' />
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
