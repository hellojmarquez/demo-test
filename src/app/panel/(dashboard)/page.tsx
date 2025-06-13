'use client';
import React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

import { fetchWithRefresh } from '@/lib/fetchWithRefresh';
import { motion } from 'framer-motion';
import {
	BarChart3,
	Users,
	CreditCard,
	Rocket,
	FileUp,
	Clock,
	Shield,
	ChevronRight,
	PlusCircle,
	Pencil,
	Trash2,
	LogIn,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import Spinner from '@/components/Spinner';

const actionIcons = {
	CREATE: PlusCircle,
	UPDATE: Pencil,
	DELETE: Trash2,
	LOGIN: LogIn,
} as const;

const actionColors = {
	CREATE: 'text-green-500',
	UPDATE: 'text-blue-500',
	DELETE: 'text-red-500',
	LOGIN: 'text-purple-500',
} as const;

export default function SelloHome() {
	const { user } = useAuth();
	const [logs, setLogs] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchLogs = async () => {
			const res = await fetchWithRefresh('/api/admin/getRecientLogs');
			const data = await res.json();
			setLogs(data.logs);
			setLoading(false);
		};
		fetchLogs();
	}, []);

	return (
		<div className="p-6 space-y-8 min-w-full mx-auto">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="flex items-center justify-between"
			>
				<h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
					Dashboard Overview
				</h1>
			</motion.div>

			<section className="space-y-4">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.1 }}
					className="flex items-center space-x-2"
				>
					<BarChart3 className="h-5 w-5 text-indigo-600" />
					<h2 className="text-xl font-semibold text-gray-800">Key Metrics</h2>
				</motion.div>

				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
					<StatCard
						icon={<Users className="h-5 w-5" />}
						title="Registered Users"
						value="328"
						trend="+12% from last month"
						color="from-blue-500 to-indigo-600"
						delay={0.2}
					/>
					<StatCard
						icon={<CreditCard className="h-5 w-5" />}
						title="Pending Balances"
						value="€2,430"
						trend="-5% from last week"
						color="from-emerald-500 to-teal-600"
						delay={0.3}
					/>
					<StatCard
						icon={<Rocket className="h-5 w-5" />}
						title="Launches This Month"
						value="17"
						trend="+3 from last month"
						color="from-amber-500 to-orange-600"
						delay={0.4}
					/>
					<StatCard
						icon={<FileUp className="h-5 w-5" />}
						title="Files Uploaded Today"
						value="94"
						trend="+28 since yesterday"
						color="from-purple-500 to-fuchsia-600"
						delay={0.5}
					/>
				</div>
			</section>
			{user?.role === 'admin' && (
				<section className="space-y-4">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.6 }}
						className="flex items-center space-x-2"
					>
						<Clock className="h-5 w-5 text-indigo-600" />
						<h2 className="text-xl font-semibold text-gray-800">
							Actividad reciente
						</h2>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.7 }}
						className="bg-white rounded-xl shadow-sm overflow-hidden"
					>
						<ul className="divide-y divide-gray-100">
							{loading ? (
								<div className="flex justify-center items-center py-8">
									<Spinner />
								</div>
							) : (
								logs.map((log: any) => {
									const Icon =
										actionIcons[log.action as keyof typeof actionIcons];
									return (
										<ActivityItem
											key={log._id}
											user={log.userName}
											detail={`${log.details} - IP: ${log.ipAddress}`}
											time={format(new Date(log.createdAt), 'PPpp', {
												locale: es,
											})}
											icon={
												<Icon
													className={`h-4 w-4 ${
														actionColors[
															log.action as keyof typeof actionColors
														]
													}`}
												/>
											}
										/>
									);
								})
							)}
						</ul>
						<div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-t border-gray-100">
							<Link
								href="/panel/logs"
								className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors flex items-center"
							>
								Ver toda la actividad
								<ChevronRight className="ml-1 w-4 h-4" />
							</Link>
						</div>
					</motion.div>
				</section>
			)}
		</div>
	);
}

function StatCard({
	icon,
	title,
	value,
	trend,
	color,
	delay,
}: {
	icon: React.ReactNode;
	title: string;
	value: string;
	trend: string;
	color: string;
	delay: number;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay }}
			className="bg-white rounded-xl shadow-sm overflow-hidden"
		>
			<div className="p-5">
				<div className="flex items-center justify-between mb-3">
					<div
						className={`bg-gradient-to-r ${color} p-2 rounded-lg text-white`}
					>
						{icon}
					</div>
					<span className="text-xs font-medium text-gray-400">{trend}</span>
				</div>
				<h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
				<p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
					{value}
				</p>
			</div>
			<div className={`h-1 bg-gradient-to-r ${color}`}></div>
		</motion.div>
	);
}

function ActivityItem({
	user,
	detail,
	time,
	icon,
}: {
	user: string;
	detail: string;
	time: string;
	icon: React.ReactNode;
}) {
	return (
		<li className="p-4 hover:bg-slate-50 transition-colors">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<div className="p-2 bg-slate-100 rounded-full">{icon}</div>
					<div>
						<p className="font-medium text-gray-800">{user}</p>
						<p className="text-sm text-gray-500">{detail}</p>
					</div>
				</div>
				<span className="text-xs font-medium text-gray-400">{time}</span>
			</div>
		</li>
	);
}
