import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PostCard from "../components/blog/PostCard.jsx";
import Avatar from "../components/shared/Avatar.jsx";
import PageHeader from "../components/shared/PageHeader.jsx";
import { fetchUserProfile } from "../services/userService.js";

export default function ProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchUserProfile(id).then(setProfile);
  }, [id]);

  if (!profile) return <p className="muted">Loading profile...</p>;

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
