import { Router } from './Router';
import { NotificationContainer } from './components/ui/Notification';
import { ConfirmContainer } from './components/ui/ConfirmDialog';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router />
      <NotificationContainer />
      <ConfirmContainer />
    </ErrorBoundary>
  );
}

export default App;
