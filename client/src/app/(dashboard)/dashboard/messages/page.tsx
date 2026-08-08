import {
	CheckCheck,
	FileText,
	Image as ImageIcon,
	MoreVertical,
	Paperclip,
	Phone,
	Search,
	Send,
	Smile,
	Video,
} from "lucide-react";

interface Message {
	id: string;
	senderId: string;
	text: string;
	timestamp: string;
	isMe: boolean;
	status?: "sent" | "delivered" | "read";
	attachment?: {
		type: "image" | "file";
		name: string;
		size?: string;
	};
}

interface ChatContact {
	id: string;
	name: string;
	role: "Tutor" | "Student";
	subject: string;
	avatarUrl?: string;
	unreadCount: number;
	online: boolean;
	lastMessage: string;
	lastMessageTime: string;
}

const MessagesPage = () => {
	// const session = await auth();

	// Mock Conversations List
	const contacts: ChatContact[] = [
		{
			id: "1",
			name: "Dr. Aris Thorne",
			role: "Tutor",
			subject: "GCSE Mathematics",
			unreadCount: 2,
			online: true,
			lastMessage: "I've uploaded the practice worksheet for quadratics.",
			lastMessageTime: "10:42 AM",
		},
		{
			id: "2",
			name: "Sarah Jenkins",
			role: "Tutor",
			subject: "GCSE Physics",
			unreadCount: 0,
			online: false,
			lastMessage: "Great job in today's lesson! See you on Thursday.",
			lastMessageTime: "Yesterday",
		},
		{
			id: "3",
			name: "Prof. Michael Faraday",
			role: "Tutor",
			subject: "GCSE Chemistry",
			unreadCount: 0,
			online: true,
			lastMessage: "Don't forget to review page 42 before next class.",
			lastMessageTime: "Aug 5",
		},
	];

	// Active Chat Messages
	const messages: Message[] = [
		{
			id: "m1",
			senderId: "1",
			text: "Hello! Just following up on our session yesterday. How are you feeling about solving quadratic equations now?",
			timestamp: "10:30 AM",
			isMe: false,
		},
		{
			id: "m2",
			senderId: "user",
			text: "Hi Dr. Thorne! I feel much more confident with the quadratic formula now, but I still struggle a bit with completing the square.",
			timestamp: "10:35 AM",
			isMe: true,
			status: "read",
		},
		{
			id: "m3",
			senderId: "1",
			text: "That's completely normal—it takes practice. I've uploaded a targeted practice worksheet for you below.",
			timestamp: "10:40 AM",
			isMe: false,
			attachment: {
				type: "file",
				name: "Completing_The_Square_Worksheet.pdf",
				size: "1.2 MB",
			},
		},
		{
			id: "m4",
			senderId: "1",
			text: "I've uploaded the practice worksheet for quadratics.",
			timestamp: "10:42 AM",
			isMe: false,
		},
	];

	const activeContact = contacts[0];

	return (
		<div className='mx-auto max-w-6xl'>
			<div className='flex h-[calc(100vh-8.5rem)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900/50'>
				{/* LEFT SIDEBAR: CONTACTS LIST */}
				<div className='flex w-full flex-col border-r border-slate-200/80 dark:border-slate-800/80 md:w-80 lg:w-96'>
					{/* Header & Search */}
					<div className='space-y-3 p-4 border-b border-slate-200/80 dark:border-slate-800/80'>
						<h1 className='text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100'>
							Messages
						</h1>
						<div className='relative'>
							<Search
								size={16}
								className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
							/>
							<input
								type='text'
								placeholder='Search messages...'
								className='w-full rounded-xl border border-slate-200/80 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900'
							/>
						</div>
					</div>

					{/* Contacts Navigation */}
					<div className='flex-1 overflow-y-auto p-2 space-y-1'>
						{contacts.map((contact) => {
							const isActive = contact.id === activeContact.id;

							return (
								<button
									key={contact.id}
									className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
										isActive
											? "bg-blue-50 dark:bg-blue-950/40"
											: "hover:bg-slate-50 dark:hover:bg-slate-800/40"
									}`}>
									{/* Avatar + Status Indicator */}
									<div className='relative flex-shrink-0'>
										<div className='flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-xs'>
											{contact.name.charAt(0)}
										</div>
										{contact.online && (
											<span className='absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900' />
										)}
									</div>

									{/* Message Preview */}
									<div className='flex-1 overflow-hidden'>
										<div className='flex items-center justify-between'>
											<h2 className='truncate text-sm font-semibold text-slate-900 dark:text-slate-100'>
												{contact.name}
											</h2>
											<span className='text-[10px] text-slate-400'>{contact.lastMessageTime}</span>
										</div>
										<p className='text-xs text-blue-600 dark:text-blue-400 font-medium'>
											{contact.subject}
										</p>
										<p className='truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
											{contact.lastMessage}
										</p>
									</div>

									{/* Unread Badge */}
									{contact.unreadCount > 0 && (
										<span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white'>
											{contact.unreadCount}
										</span>
									)}
								</button>
							);
						})}
					</div>
				</div>

				{/* RIGHT SIDE: ACTIVE CONVERSATION */}
				<div className='hidden flex-1 flex-col md:flex'>
					{/* Chat Topbar */}
					<div className='flex h-16 items-center justify-between border-b border-slate-200/80 px-6 backdrop-blur-xs dark:border-slate-800/80'>
						<div className='flex items-center gap-3'>
							<div className='relative'>
								<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white'>
									{activeContact.name.charAt(0)}
								</div>
								{activeContact.online && (
									<span className='absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900' />
								)}
							</div>
							<div>
								<h2 className='text-sm font-bold text-slate-900 dark:text-slate-100'>
									{activeContact.name}
								</h2>
								<p className='text-xs text-slate-500 dark:text-slate-400'>
									{activeContact.subject} • {activeContact.online ? "Online" : "Offline"}
								</p>
							</div>
						</div>

						<div className='flex items-center gap-2 text-slate-500 dark:text-slate-400'>
							<button className='rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800'>
								<Phone size={18} />
							</button>
							<button className='rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800'>
								<Video size={18} />
							</button>
							<button className='rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800'>
								<MoreVertical size={18} />
							</button>
						</div>
					</div>

					{/* Chat Messages Body */}
					<div className='flex-1 overflow-y-auto p-6 space-y-4'>
						<div className='text-center'>
							<span className='rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400'>
								Today
							</span>
						</div>

						{messages.map((msg) => (
							<div
								key={msg.id}
								className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
								<div
									className={`max-w-md rounded-2xl px-4 py-2.5 text-sm ${
										msg.isMe
											? "bg-blue-600 text-white rounded-br-xs"
											: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 rounded-bl-xs"
									}`}>
									<p>{msg.text}</p>

									{/* Attachment Card */}
									{msg.attachment && (
										<div className='mt-2.5 flex items-center gap-3 rounded-xl bg-white/10 p-2.5 text-xs backdrop-blur-xs'>
											<div className='rounded-lg bg-white/20 p-2'>
												<FileText size={18} />
											</div>
											<div className='truncate'>
												<p className='font-semibold truncate'>{msg.attachment.name}</p>
												<p className='text-[10px] opacity-80'>{msg.attachment.size}</p>
											</div>
										</div>
									)}
								</div>

								{/* Timestamp & Delivery Status */}
								<div className='mt-1 flex items-center gap-1 text-[10px] text-slate-400'>
									<span>{msg.timestamp}</span>
									{msg.isMe && <CheckCheck size={14} className='text-blue-500' />}
								</div>
							</div>
						))}
					</div>

					{/* Message Input Controls */}
					<div className='border-t border-slate-200/80 p-4 dark:border-slate-800/80'>
						<div className='flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 p-2 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-500 dark:border-slate-800 dark:bg-slate-800/50 dark:focus-within:bg-slate-900'>
							<button className='rounded-lg p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'>
								<Paperclip size={18} />
							</button>
							<button className='rounded-lg p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'>
								<ImageIcon size={18} />
							</button>

							<input
								type='text'
								placeholder='Type your message...'
								className='flex-1 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500'
							/>

							<button className='rounded-lg p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'>
								<Smile size={18} />
							</button>
							<button className='inline-flex items-center justify-center rounded-lg bg-blue-600 p-2 text-white transition-all hover:bg-blue-500 active:scale-[0.98]'>
								<Send size={16} />
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
export default MessagesPage;
