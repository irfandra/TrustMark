import { useRole } from '../../components/context/RoleContext';
import UserHome from '../(users)/home';
import CompanyHome from '../(company)/home';

export default function HomeScreen() {
  const { role } = useRole();
  console.log('Current role:', role);

  if (role === 'user') {
    return <UserHome />;
  } else {
    return <CompanyHome />;
  }
}