import { useAuthStore } from '../stores/authStore';
import {
  LayoutDashboard,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  FolderKanban,
  Sparkles,
  Zap,
  Award,
  Target,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 space-y-6">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 left-20 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 right-40 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Header với Glass Morphism */}
      <div className="relative overflow-hidden bg-white/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 p-8">
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-pulse" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse" />
                <div className="relative p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl transform hover:scale-110 hover:rotate-6 transition-all duration-500">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-gray-600 text-lg mt-1">
                  Welcome back, <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{user?.first_name || user?.username}</span>! 👋
                </p>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="group relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-2xl px-8 py-4 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <p className="text-sm font-semibold text-gray-600 mb-1">Your Role</p>
                <p className="text-2xl font-black capitalize bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards with Floating Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<LayoutDashboard className="h-7 w-7" />}
          title="Total Tasks"
          value="0"
          color="from-blue-500 to-cyan-600"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          delay="0"
        />
        <StatCard
          icon={<Clock className="h-7 w-7" />}
          title="In Progress"
          value="0"
          color="from-yellow-500 to-orange-600"
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          delay="100"
        />
        <StatCard
          icon={<CheckCircle className="h-7 w-7" />}
          title="Completed"
          value="0"
          color="from-green-500 to-emerald-600"
          iconBg="bg-green-100"
          iconColor="text-green-600"
          delay="200"
        />
        <StatCard
          icon={<AlertCircle className="h-7 w-7" />}
          title="Pending Review"
          value="0"
          color="from-purple-500 to-pink-600"
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          delay="300"
        />
      </div>

      {/* Grid 2 cột with Glass Effect */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <div className="group relative bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Quick Stats</h2>
            </div>
            <div className="space-y-4">
              <QuickStatItem
                icon={<FolderKanban className="h-5 w-5" />}
                label="Active Projects"
                value="0"
                color="text-blue-600"
                bgColor="bg-blue-50"
              />
              <QuickStatItem
                icon={<Users className="h-5 w-5" />}
                label="Team Members"
                value="1"
                color="text-indigo-600"
                bgColor="bg-indigo-50"
              />
              <QuickStatItem
                icon={<Award className="h-5 w-5" />}
                label="Success Rate"
                value="100%"
                color="text-green-600"
                bgColor="bg-green-50"
              />
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="group relative bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">System Status</h2>
            </div>
            <div className="space-y-4">
              <StatusItem
                label="Backend API"
                status="Connected"
                isActive={true}
              />
              <StatusItem
                label="Frontend App"
                status="Running"
                isActive={true}
              />
              <StatusItem
                label="Database"
                status="Active"
                isActive={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Card with Enhanced Design */}
      <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/40 via-purple-100/40 to-pink-100/40" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              🚀 Getting Started
            </h2>
          </div>
          <p className="text-gray-700 mb-6 text-lg font-medium">
            Your freelancer management system is ready! Here's what you can do:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionCard
              title="Create Projects"
              description="Start by creating your first project"
              color="from-blue-500 to-cyan-600"
              index="0"
            />
            <ActionCard
              title="Add Tasks"
              description="Create and assign tasks to freelancers"
              color="from-purple-500 to-pink-600"
              index="1"
            />
            <ActionCard
              title="Manage Team"
              description="Invite and manage team members"
              color="from-orange-500 to-red-600"
              index="2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color, iconBg, iconColor, delay }) {
  return (
    <div
      className="group relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient Border Effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />
      <div className="absolute inset-[2px] bg-white rounded-2xl" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-600">{title}</p>
          <p className={`text-5xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
            {value}
          </p>
        </div>
        <div className={`${iconBg} p-4 rounded-2xl ${iconColor} shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
          {icon}
        </div>
      </div>

      {/* Bottom Accent Line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color} rounded-b-2xl`} />
    </div>
  );
}

function QuickStatItem({ icon, label, value, color, bgColor }) {
  return (
    <div className="group flex items-center justify-between p-4 rounded-xl bg-white/60 hover:bg-white/80 border border-white/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-center gap-3">
        <div className={`${bgColor} p-3 rounded-xl ${color} shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
          {icon}
        </div>
        <span className="font-bold text-gray-900">{label}</span>
      </div>
      <span className="text-2xl font-black text-gray-900">{value}</span>
    </div>
  );
}

function StatusItem({ label, status, isActive }) {
  return (
    <div className="group flex items-center justify-between p-4 rounded-xl bg-white/60 hover:bg-white/80 border border-white/50 hover:shadow-lg transition-all duration-300">
      <span className="font-bold text-gray-900">{label}</span>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className={`h-3 w-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
          {isActive && (
            <div className="absolute inset-0 h-3 w-3 rounded-full bg-green-500 animate-ping" />
          )}
        </div>
        <span className={`text-sm font-black ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

function ActionCard({ title, description, color, index }) {
  return (
    <div
      className="group relative bg-white/70 backdrop-blur-xl rounded-xl p-6 border border-white/50 hover:border-white/80 hover:shadow-xl transition-all duration-500 cursor-pointer overflow-hidden hover:-translate-y-1"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Hover Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

      <div className="relative z-10">
        <div className={`h-2 w-16 rounded-full bg-gradient-to-r ${color} mb-4 group-hover:w-full transition-all duration-500 shadow-lg`} />
        <h3 className="font-black text-gray-900 mb-2 text-lg group-hover:text-xl transition-all duration-300">{title}</h3>
        <p className="text-sm text-gray-600 font-medium">{description}</p>
      </div>

      {/* Arrow Icon on Hover */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className={`p-2 bg-gradient-to-br ${color} rounded-lg shadow-lg`}>
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
