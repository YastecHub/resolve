import { redirect } from 'react-router';
import { paths } from '~/lib/paths';

export function clientLoader({ request }: { request: Request }) {
  const { search } = new URL(request.url);
  return redirect(`${paths.login}${search}`);
}

export default function LoginRedirect() {
  return null;
}
