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
} from 'lucide-react';

export default function SelloHome() {
	const {
		user,
		loading,
		currentAccount,
		showAccountSelector,
		setShowAccountSelector,
	} = useAuth();

	const [userData, setUserData] = useState<any>(null);
	const router = useRouter();

	// Redirect if no user
	useEffect(() => {
		if (!loading && !user) {
			router.push('/sello/login');
		}
	}, [user, loading, router]);

	// Show account selector if there's more than one
	useEffect(() => {
		if (user?.accounts && user.accounts.length > 1 && !currentAccount) {
			setShowAccountSelector(true);
		}
	}, [user, currentAccount, setShowAccountSelector]);

	// Update data when user or selected account changes
	useEffect(() => {
		if (currentAccount) {
			setUserData(currentAccount);
		} else if (user) {
			setUserData(user);
		}
	}, [user, currentAccount]);

	useEffect(() => {
		if (currentAccount) {
			const getAccountData = async () => {
				try {
					const res = await fetchWithRefresh(
						`/api/accounts/${currentAccount.id}`
					);
					const data = await res.json();
					setUserData(data);
				} catch (error) {
					console.error('Error fetching data:', error);
				}
			};

			getAccountData();
		}
	}, [currentAccount]);

	if (loading || !userData) {
		return (
			<div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
				<div className="flex flex-col items-center">
					<div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mb-4"></div>
					<p className="text-indigo-600 font-medium">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-8 max-w-7xl mx-auto">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="flex items-center justify-between"
			>
				<h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
					Dashboard Overview
				</h1>
				<div className="bg-white shadow-sm rounded-full px-4 py-2 flex items-center space-x-2">
					<div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold">
						{userData.name?.charAt(0) || 'U'}
					</div>
					<span className="font-medium text-gray-700 hidden md:inline">
						{userData.name || 'User'}
					</span>
				</div>
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

			<section className="space-y-4">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.6 }}
					className="flex items-center space-x-2"
				>
					<Clock className="h-5 w-5 text-indigo-600" />
					<h2 className="text-xl font-semibold text-gray-800">
						Recent Activity
					</h2>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.7 }}
					className="bg-white rounded-xl shadow-sm overflow-hidden"
				>
					<ul className="divide-y divide-gray-100">
						<ActivityItem
							user="Carlos"
							detail="IP: 192.168.1.1"
							time="3 min ago"
							icon={<Shield className="h-4 w-4 text-blue-500" />}
						/>
						<ActivityItem
							user="Laura"
							detail="IP: 81.34.99.23"
							time="22 min ago"
							icon={<Shield className="h-4 w-4 text-green-500" />}
						/>
						<ActivityItem
							user="API Upload"
							detail="Sello Z"
							time="Today 12:33"
							icon={<FileUp className="h-4 w-4 text-amber-500" />}
						/>
						<ActivityItem
							user="System"
							detail="Backup completed"
							time="Today 09:15"
							icon={<Shield className="h-4 w-4 text-purple-500" />}
						/>
						<ActivityItem
							user="Miguel"
							detail="IP: 82.223.45.67"
							time="Yesterday 18:42"
							icon={<Shield className="h-4 w-4 text-blue-500" />}
						/>
					</ul>
					<div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-t border-gray-100">
						<button className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors flex items-center">
							View all activity
							<svg
								className="ml-1 w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</button>
					</div>
				</motion.div>
			</section>
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
