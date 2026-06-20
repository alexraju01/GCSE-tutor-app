interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  themeColor: "blue" | "indigo" | "purple";
}

const FeatureCard = ({
  icon,
  title,
  description,
  className = "",
  themeColor,
}: FeatureCardProps) => {
  // Maps color variants nicely to keep classes legible
  const themeMap = {
    blue: {
      hoverBorder: "hover:border-blue-500/40 dark:hover:border-blue-500/30",
      hoverShadow: "dark:hover:shadow-[0_0_30px_rgba(37,99,235,0.05)]",
      bgGlow: "bg-blue-500/3 dark:bg-blue-500/5 group-hover:bg-blue-500/10",
      iconBg:
        "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400",
      iconHoverBg: "group-hover:bg-blue-600 dark:group-hover:bg-blue-500",
      textHover: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
    },
    indigo: {
      hoverBorder: "hover:border-indigo-500/40 dark:hover:border-indigo-500/30",
      hoverShadow: "dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.05)]",
      bgGlow:
        "bg-indigo-500/3 dark:bg-indigo-500/5 group-hover:bg-indigo-500/10",
      iconBg:
        "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-400",
      iconHoverBg: "group-hover:bg-indigo-600 dark:group-hover:bg-indigo-600",
      textHover: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
    },
    purple: {
      hoverBorder: "hover:border-purple-500/40 dark:hover:border-purple-500/30",
      hoverShadow: "dark:hover:shadow-[0_0_30px_rgba(168,85,247,0.05)]",
      bgGlow:
        "bg-purple-500/3 dark:bg-purple-500/5 group-hover:bg-purple-500/10",
      iconBg:
        "bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20 text-purple-400",
      iconHoverBg: "group-hover:bg-purple-600 dark:group-hover:bg-purple-600",
      textHover: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
    },
  };

  const theme = themeMap[themeColor];

  return (
    <div
      className={`group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 transition-all duration-500 hover:shadow-[0_15px_30px_rgba(0,0,0,0.03)] dark:border-slate-800/80 dark:bg-linear-to-b dark:from-slate-900 dark:to-[#111625] ${theme.hoverBorder} ${theme.hoverShadow} ${className}`}
    >
      <div
        className={`absolute -right-10 -bottom-10 size-44 rounded-full blur-2xl filter transition-colors duration-500 ${theme.bgGlow}`}
      />

      <div
        className={`flex size-12 items-center justify-center rounded-2xl border transition-all duration-500 ease-out group-hover:scale-110 group-hover:text-white ${theme.iconBg} ${theme.iconHoverBg}`}
      >
        {icon}
      </div>

      <div className="relative z-10 max-w-md">
        <h3
          className={`mb-2 text-lg font-bold tracking-tight text-slate-900 transition-colors duration-300 dark:text-white ${theme.textHover}`}
        >
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
};

export default FeatureCard;
