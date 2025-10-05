import { Router } from './Router';
import { NotificationContainer } from './components/ui/Notification';
import { ConfirmContainer } from './components/ui/ConfirmDialog';

function App() {
  return (
    <>
      <Router />
      <NotificationContainer />
      <ConfirmContainer />
    </>
  );
}

export default App;
