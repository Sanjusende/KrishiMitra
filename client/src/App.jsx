import { useLocation } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import AppRoutes from './routes/AppRoutes';

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return <AppRoutes />;
  }

  return (
    <AppLayout>
      <AppRoutes />
    </AppLayout>
  );
}

export default App;
