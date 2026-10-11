import { Redirect } from 'expo-router';

/** A link or route the app does not have lands on Home rather than a router error page. */
export default function NotFound() {
  return <Redirect href="/" />;
}
