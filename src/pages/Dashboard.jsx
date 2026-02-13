// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// const data = [
//   { name: 'Jan', uv: 400 }, { name: 'Feb', uv: 300 }, { name: 'Mar', uv: 600 },
// ];

// export default function Dashboard() {
//   return (
//     <div className="space-y-6">
//       <h1 className="text-3xl font-bold">Dashboard Overview</h1>
      
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <Card><CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader>
//           <CardContent className="text-2xl font-bold">$45,231</CardContent>
//         </Card>
//         {/* Add more ShadCN Cards here */}
//       </div>

//       <Card className="p-4">
//         <CardHeader><CardTitle>User Activity</CardTitle></CardHeader>
//         <div className="h-[300px] w-full">
//           <ResponsiveContainer width="100%" height="100%">
//             <LineChart data={data}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="name" />
//               <YAxis />
//               <Tooltip />
//               <Line type="monotone" dataKey="uv" stroke="#8884d8" strokeWidth={2} />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </Card>
//     </div>
//   );
// }

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { DollarSign, Users, ArrowUpRight, TrendingUp } from "lucide-react";

const data = [
  { name: 'Jan', uv: 4000 }, { name: 'Feb', uv: 3000 }, { name: 'Mar', uv: 5000 },
  { name: 'Apr', uv: 4500 }, { name: 'May', uv: 6000 }, { name: 'Jun', uv: 5500 },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500">Here's what's happening with your projects today.</p>
      </div>
      
      {/* Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Revenue" value="$45,231" icon={DollarSign} trend="+12.5%" />
        <StatCard title="Active Users" value="2,350" icon={Users} trend="+3.2%" />
        <StatCard title="Conversion Rate" value="4.8%" icon={TrendingUp} trend="-1.5%" isNegative />
      </div>

      {/* Main Chart Card */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-none pb-0">
          <CardTitle className="text-xl font-bold text-slate-800">Growth Analytics</CardTitle>
          <p className="text-sm text-slate-500">Monthly user engagement and revenue growth</p>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="uv" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for reusable stat cards
function StatCard({ title, value, icon: Icon, trend, isNegative }) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Icon size={24} />
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${isNegative ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {trend}
          </span>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}