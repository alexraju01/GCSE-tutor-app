import { api } from "@utils/api";

const TeachersPage = async () => {
  const teachers = await api.teacher.getAll();
  return <>List of teacher</>;
};

export default TeachersPage;
