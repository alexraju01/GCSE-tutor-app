import { api } from "@utils/api";

const TeachersPage = async () => {
  const teachers = await api.teacher.getAll();
  console.log(teachers);
  return <>List of teacher</>;
};

export default TeachersPage;
