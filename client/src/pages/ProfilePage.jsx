import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PostCard from "../components/blog/PostCard.jsx";
import Avatar from "../components/shared/Avatar.jsx";
import LoadingState from "../components/shared/LoadingState.jsx";
import PageHeader from "../components/shared/PageHeader.jsx";
import { fetchUserProfile } from "../services/userService.js";

export default function ProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchUserProfile(id)
      .then((data) => { if (active) setProfile(data); })
      .catch((err) => { if (active) setMessage(err?.response?.data?.message || "Could not load profile."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <LoadingState label="Loading profile..." />;
  if (!profile) return <p className="error">{message || "Profile not found."}</p>;

  return (
    <>
      <PageHeader eyebrow="Author profile" title={profile.user.name} />
      <section className="profile-hero panel">
        <Avatar user={profile.user} size="lg" />
        <div>
          <h2>{profile.user.name}</h2>
          <p>{profile.user.department} · {profile.user.role}</p>
          <p>{profile.user.bio || "No bio yet."}</p>
        </div>
      </section>
      <h2>Published posts</h2>
      <div className="feed-list">{profile.posts.map((post) => <PostCard key={post._id} post={{ ...post, author: profile.user }} />)}</div>
    </>
  );
}
