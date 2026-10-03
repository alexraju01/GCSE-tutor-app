import { UserRole } from "@/types/role";

import { BookingPolicySection } from "@components/BookingPolicySection";
import { PersonalInfoSection } from "@components/PersonalInfoSection";
import { ProfileHeader } from "@components/ProfileHeader";
import { ProfilePhotoSection } from "@components/ProfilePhotoSection";
import { TeachingInformationSection } from "@components/TeachingInformationSection";
import { requireRole } from "@utils/actions/session";
import { api } from "@utils/api";

const TeacherProfilePage = async () => {
  const { token } = await requireRole(UserRole.Teacher);

  const { data: teacher } = await api.teacher.getMyProfile(token);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased">
      <ProfileHeader />

      <main className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-6 px-4 pb-24 lg:grid-cols-3">
        <div className="order-first space-y-6 lg:order-2">
          <ProfilePhotoSection image={teacher?.user?.image} />
        </div>

        <div className="order-last space-y-6 lg:order-1 lg:col-span-2">
          <PersonalInfoSection key={teacher?.user?.name || "loading"} user={teacher?.user} />

          <TeachingInformationSection
            key={teacher?.id || "teaching-loading"}
            teaches={teacher?.teaches}
          />

          {teacher && (
            <BookingPolicySection
              policy={{
                requireApproval: teacher.requireApproval,
                minNoticeHours: teacher.minNoticeHours,
                maxAdvanceDays: teacher.maxAdvanceDays,
                cancellationCutoffHours: teacher.cancellationCutoffHours,
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherProfilePage;
