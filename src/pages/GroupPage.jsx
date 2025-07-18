import './GroupPage.css';
import GroupDashboard from "../components/Groups/GroupDashboard";
import BackButton from '../components/BackButton';

const GroupPage = () => (
  <>
    <BackButton />
    <div className="group-page-container">
      <div className="group-page-section">
        <GroupDashboard />
      </div>
    </div>
  </>
);

export default GroupPage; 