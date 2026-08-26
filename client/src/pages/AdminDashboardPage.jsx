import { useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  Eye,
  FileText,
  FolderOpen,
  Heart,
  MessageCircle,
  Trophy,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import LoadingState from "../components/shared/LoadingState.jsx";
import PageHeader from "../components/shared/PageHeader.jsx";
import { useConfirm } from "../hooks/useConfirm.jsx";
import { deactivatePost, fetchAdminPosts, fetchAdminStats } from "../services/adminService.js";

/* ─── palette ─────────────────────────────────────────────── */
const TEAL   = "#0f766e";
const TEAL2  = "#14b8a6";
const AMBER  = "#f59e0b";
const ROSE   = "#f43f5e";
const INDIGO = "#6366f1";
const SLATE  = "#64748b";
const PIE_COLORS = [TEAL, TEAL2, AMBER, ROSE, INDIGO, SLATE];

/* ─── tiny helpers ─────────────────────────────────────────── */
function Card({ title, children, span = 1 }) {
  return (
    <div className="adm-card" style={{ gridColumn: `span ${span}` }}>
      {title && <h3 className="adm-card-title">{title}</h3>}
      {children}
    </div>
  );
}

function KPI({ label, value, icon, color = TEAL }) {
  return (
    <div className="adm-kpi" style={{ borderTop: `3px solid ${color}` }}>
      <span className="adm-kpi-icon">{icon}</span>
      <strong className="adm-kpi-value">{value ?? "—"}</strong>
      <span className="adm-kpi-label">{label}</span>
    </div>
  );
}

/* truncate long titles for chart labels */
function shortTitle(t = "", max = 22) {
  return t.length > max ? t.slice(0, max) + "…" : t;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="adm-tooltip">
      {label && <p className="adm-tooltip-label">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function AdminDashboardPage() {
  const [stats, setStats]   = useState(null);
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const { confirm, confirmDialog } = useConfirm();

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    try {
      setLoading(true);
      const [nextStats, nextPosts] = await Promise.all([fetchAdminStats(), fetchAdminPosts()]);
      setStats(nextStats);
      setPosts(nextPosts);
      setMessage("");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }

  async function deactivate(id, title) {
    const isConfirmed = await confirm({
      title: "Deactivate Post",
      message: `Are you sure you want to deactivate "${title || "this post"}"? It will be removed from public view.`,
      danger: true
    });
    if (!isConfirmed) return;
    await deactivatePost(id);
    refresh();
  }

  if (loading) return <LoadingState label="Loading analytics..." />;
  if (message) return <p className="error">{message}</p>;

  /* ── derived chart data ── */
  const topViewedData = (stats?.topViewedPosts ?? []).map((p) => ({
    name: shortTitle(p.title),
    Views: p.viewsCount,
    author: p.author?.name,
  }));

  const topLikedData = (stats?.topLikedPosts ?? []).map((p) => ({
    name: shortTitle(p.title),
    Likes: p.likesCount,
    author: p.author?.name,
  }));

  const postsPerDayData = stats?.postsPerDay ?? [];

  const deptData = (stats?.departmentBreakdown ?? []).map((d) => ({
    name: d.department || "Unknown",
    Posts: d.posts,
    Likes: d.totalLikes,
    Views: d.totalViews,
  }));

  const activeUsersData = (stats?.activeUsers ?? []).map((u) => ({
    name: u.user?.name ?? "—",
    Posts: u.posts,
    Likes: u.likes,
    Views: u.views,
  }));

  return (
    <>
      <PageHeader eyebrow="Admin" title="Company Analytics" />

      {/* ── KPI strip ── */}
      <div className="adm-kpi-grid">
        <KPI label="Total Users"    value={stats?.totalUsers}    icon={<Users size={24} />} color={TEAL}   />
        <KPI label="Published Posts" value={stats?.totalPosts}   icon={<FileText size={24} />} color={INDIGO} />
        <KPI label="Space Items"    value={stats?.totalItems}    icon={<FolderOpen size={24} />}  color={AMBER}  />
        <KPI label="Comments"       value={stats?.totalComments} icon={<MessageCircle size={24} />} color={ROSE}   />
      </div>

      {/* ── charts grid ── */}
      <div className="adm-grid">

        {/* 1. Posts published over time */}
        <Card title={<><CalendarDays size={17} /> Posts Published - Last 14 Days</>} span={2}>
          {postsPerDayData.length === 0 ? (
            <p className="adm-empty">No posts in the last 14 days.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={postsPerDayData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" name="Posts" stroke={TEAL} strokeWidth={2.5} dot={{ r: 4, fill: TEAL }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* 2. Pie: posts by department */}
        <Card title={<><Building2 size={17} /> Posts by Department</>}>
          {deptData.length === 0 ? (
            <p className="adm-empty">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={deptData}
                  dataKey="Posts"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {deptData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* 3. Top 5 most viewed posts */}
        <Card title={<><Eye size={17} /> Top 5 Most Viewed Posts</>} span={2}>
          {topViewedData.length === 0 ? (
            <p className="adm-empty">No views recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topViewedData} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, fill: "#334155" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Views" fill={TEAL} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* 4. Top 5 most liked posts */}
        <Card title={<><Heart size={17} /> Top 5 Most Liked Posts</>}>
          {topLikedData.length === 0 ? (
            <p className="adm-empty">No likes yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topLikedData} margin={{ top: 4, right: 16, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} angle={-25} textAnchor="end" interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Likes" fill={ROSE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* 5. Most active users — grouped bar */}
        <Card title={<><Trophy size={17} /> Most Active Users (Posts - Likes - Views)</>} span={3}>
          {activeUsersData.length === 0 ? (
            <p className="adm-empty">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={activeUsersData} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#334155" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Bar dataKey="Posts" fill={TEAL}   radius={[3, 3, 0, 0]} />
                <Bar dataKey="Likes" fill={ROSE}   radius={[3, 3, 0, 0]} />
                <Bar dataKey="Views" fill={INDIGO} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* 6. Department engagement table */}
        {deptData.length > 0 && (
          <Card title={<><BarChart3 size={17} /> Department Engagement Breakdown</>} span={3}>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Posts</th>
                    <th>Total Likes</th>
                    <th>Total Views</th>
                    <th>Avg Likes / Post</th>
                  </tr>
                </thead>
                <tbody>
                  {deptData.map((d) => (
                    <tr key={d.name}>
                      <td><strong>{d.name}</strong></td>
                      <td>{d.Posts}</td>
                      <td>{d.Likes}</td>
                      <td>{d.Views}</td>
                      <td>{d.Posts ? (d.Likes / d.Posts).toFixed(1) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* ── All posts moderation table ── */}
      <h2 className="adm-section-title"><FolderOpen size={19} /> All Posts - Moderation</h2>
      <section className="table-list">
        {posts.map((post) => (
          <article className="table-row" key={post._id}>
            <div>
              <h3>{post.title}</h3>
              <p>{post.author?.name} · {post.author?.department}</p>
              <p className="adm-mini-stats">
                <Eye size={13} /> {post.views?.length ?? 0} <Heart size={13} /> {post.likes?.length ?? 0}
              </p>
            </div>
            <span className={`adm-status ${post.isActive ? "active" : "inactive"}`}>
              {post.isActive ? "Active" : "Inactive"}
            </span>
            {post.isActive && (
              <button className="small danger" onClick={() => deactivate(post._id, post.title)}>
                Deactivate
              </button>
            )}
          </article>
        ))}
      </section>
      {confirmDialog}
    </>
  );
}
