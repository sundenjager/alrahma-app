import React, { useState, useEffect } from 'react';
import { Heart, Users, Sparkles, ArrowDown } from 'lucide-react';
import { fetchMembers } from '../../services/memberService';
import { getSupplies } from '../../services/suppliesService';
import ongoingProjectsService from '../../services/ongoingProjectsService';

const Dashboard = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [stats, setStats] = useState({
    activeMembers: 0,
    completedProjects: 0,
    donations: 0,
    loading: true
  });

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 3);
    }, 3000);
    
    // Fetch actual data
    fetchDashboardData();
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch active members
      const membersResponse = await fetchMembers();
      const activeMembers = membersResponse.filter(m => m.isActive).length;

      // Fetch completed projects
      const completedProjectsResponse = await ongoingProjectsService.getCompletedProjects();
      const completedProjects = completedProjectsResponse.length;

      // Fetch donations only (not purchases)
      const suppliesResponse = await getSupplies({ nature: 'Donation' });
      const donations = suppliesResponse.totalCount || suppliesResponse.data?.length || 0;

      setStats({
        activeMembers,
        completedProjects,
        donations,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const features = [
    { icon: Heart, text: 'نعمل من أجل مجتمع أفضل', color: '#3d6b4a' },
    { icon: Users, text: 'معاً نصنع الفرق', color: '#28502d' },
    { icon: Sparkles, text: 'أمل جديد لكل عائلة', color: '#4a7c59' }
  ];

  const CurrentIcon = features[currentFeature].icon;

  return (
    <div style={styles.container}>
      {/* Animated Background */}
      <div style={styles.backgroundOverlay}>
        <div style={{...styles.circle, ...styles.circle1}}></div>
        <div style={{...styles.circle, ...styles.circle2}}></div>
        <div style={{...styles.circle, ...styles.circle3}}></div>
      </div>

      {/* Main Content */}
      <div style={{
        ...styles.content,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)'
      }}>
        {/* Logo/Icon */}
        <div style={styles.iconWrapper}>
          <div style={styles.iconCircle}>
            <CurrentIcon 
              size={80} 
              color={features[currentFeature].color}
              style={styles.icon}
            />
          </div>
        </div>

        {/* Main Heading */}
        <h1 style={styles.title}>
          أهلاً بك في
        </h1>
        <h2 style={styles.subtitle}>
          جمعية الرحمة للعمل الخيري
        </h2>

        {/* Animated Feature Text */}
        <div style={styles.featureContainer}>
          <p style={styles.featureText}>
            {features[currentFeature].text}
          </p>
        </div>

        {/* Description */}
        <p style={styles.description}>
          منصة متكاملة لإدارة الأنشطة الخيرية والمشاريع الإنسانية
          <br />
          معاً نبني مستقبلاً أفضل لمجتمعنا
        </p>

        {/* CTA Button */}
        <button style={styles.button}>
          <span>ابدأ الآن</span>
          <ArrowDown size={20} style={styles.buttonIcon} />
        </button>

        {/* Stats */}
        <div style={styles.statsContainer}>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>
              {stats.loading ? (
                <span style={styles.loader}>...</span>
              ) : (
                `${stats.activeMembers}+`
              )}
            </div>
            <div style={styles.statLabel}>عضو نشط</div>
          </div>
          <div style={styles.statDivider}></div>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>
              {stats.loading ? (
                <span style={styles.loader}>...</span>
              ) : (
                `${stats.completedProjects}+`
              )}
            </div>
            <div style={styles.statLabel}>مشروع منجز</div>
          </div>
          <div style={styles.statDivider}></div>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>
              {stats.loading ? (
                <span style={styles.loader}>...</span>
              ) : (
                stats.donations
              )}
            </div>
            <div style={styles.statLabel}>تبرع</div>
          </div>
        </div>
      </div>

      {/* Floating Particles */}
      <div style={styles.particle1}></div>
      <div style={styles.particle2}></div>
      <div style={styles.particle3}></div>
      <div style={styles.particle4}></div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e8f3ec 0%, #d4e8da 50%, #c1dcc9 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    direction: 'rtl',
    padding: '40px 20px 100vh 20px',
  },
  backgroundOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: '50%',
    background: 'rgba(40, 80, 45, 0.08)',
    animation: 'float 20s infinite ease-in-out',
  },
  circle1: {
    width: '400px',
    height: '400px',
    top: '-200px',
    right: '-100px',
    animationDelay: '0s',
  },
  circle2: {
    width: '300px',
    height: '300px',
    bottom: '-150px',
    left: '-50px',
    animationDelay: '7s',
  },
  circle3: {
    width: '250px',
    height: '250px',
    top: '50%',
    left: '10%',
    animationDelay: '14s',
  },
  content: {
    textAlign: 'center',
    zIndex: 10,
    maxWidth: '900px',
    transition: 'all 1s ease-out',
  },
  iconWrapper: {
    marginBottom: '30px',
    animation: 'bounce 2s infinite',
  },
  iconCircle: {
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    background: 'white',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 20px 60px rgba(40, 80, 45, 0.25)',
    animation: 'pulse 3s infinite',
  },
  icon: {
    animation: 'rotate 3s infinite ease-in-out',
  },
  title: {
    fontSize: '3rem',
    fontWeight: '300',
    color: '#1a3d20',
    marginBottom: '10px',
    animation: 'fadeInDown 1s ease-out',
  },
  subtitle: {
    fontSize: '4rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #28502d 0%, #3d6b4a 50%, #4a7c59 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '30px',
    animation: 'fadeInDown 1s ease-out 0.2s backwards',
  },
  featureContainer: {
    minHeight: '40px',
    marginBottom: '20px',
  },
  featureText: {
    fontSize: '1.5rem',
    color: '#2d5a38',
    fontWeight: '600',
    animation: 'fadeIn 0.5s ease-in',
  },
  description: {
    fontSize: '1.2rem',
    color: '#3d6b4a',
    lineHeight: '1.8',
    marginBottom: '40px',
    maxWidth: '700px',
    margin: '0 auto 40px',
    animation: 'fadeInUp 1s ease-out 0.4s backwards',
  },
  button: {
    background: 'linear-gradient(135deg, #3d6b4a 0%, #28502d 100%)',
    color: 'white',
    border: 'none',
    padding: '18px 50px',
    fontSize: '1.3rem',
    borderRadius: '50px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 10px 30px rgba(40, 80, 45, 0.35)',
    transition: 'all 0.3s ease',
    fontWeight: '600',
    animation: 'fadeInUp 1s ease-out 0.6s backwards',
    marginBottom: '60px',
  },
  buttonIcon: {
    animation: 'bounce 2s infinite',
  },
  statsContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0',
    marginTop: '60px',
    animation: 'fadeInUp 1s ease-out 0.8s backwards',
  },
  statItem: {
    padding: '0 40px',
  },
  statNumber: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#28502d',
    marginBottom: '8px',
    minHeight: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: '1rem',
    color: '#3d6b4a',
    fontWeight: '500',
  },
  statDivider: {
    width: '2px',
    height: '60px',
    background: 'linear-gradient(to bottom, transparent, #3d6b4a, transparent)',
  },
  loader: {
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  particle1: {
    position: 'absolute',
    width: '10px',
    height: '10px',
    background: '#3d6b4a',
    borderRadius: '50%',
    top: '20%',
    left: '10%',
    animation: 'float 15s infinite ease-in-out',
    opacity: 0.6,
  },
  particle2: {
    position: 'absolute',
    width: '15px',
    height: '15px',
    background: '#4a7c59',
    borderRadius: '50%',
    top: '60%',
    right: '15%',
    animation: 'float 18s infinite ease-in-out 5s',
    opacity: 0.5,
  },
  particle3: {
    position: 'absolute',
    width: '8px',
    height: '8px',
    background: '#28502d',
    borderRadius: '50%',
    bottom: '30%',
    left: '20%',
    animation: 'float 20s infinite ease-in-out 10s',
    opacity: 0.7,
  },
  particle4: {
    position: 'absolute',
    width: '12px',
    height: '12px',
    background: '#3d6b4a',
    borderRadius: '50%',
    top: '40%',
    right: '25%',
    animation: 'float 16s infinite ease-in-out 3s',
    opacity: 0.4,
  },
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 20px 60px rgba(40, 80, 45, 0.25);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 25px 80px rgba(40, 80, 45, 0.35);
    }
  }
  
  @keyframes rotate {
    0%, 100% {
      transform: rotate(0deg);
    }
    50% {
      transform: rotate(10deg);
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translate(0, 0) scale(1);
    }
    33% {
      transform: translate(30px, -30px) scale(1.1);
    }
    66% {
      transform: translate(-20px, 20px) scale(0.9);
    }
  }
  
  button:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(40, 80, 45, 0.45) !important;
  }
  
  button:active {
    transform: translateY(-1px);
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;