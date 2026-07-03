interface TeacherPageProps {
	params: Promise<{ teacherId: string }>;
}

const page = async ({ params }: TeacherPageProps) => {
	const { teacherId } = await params;
	return <div>Teacher Page ID: {teacherId}</div>;
};

export default page;
