import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { selectAuth, clearCredentials } from '@/store/authSlice';
import { useLogoutMutation } from '@/store/api/authApi';
import { baseApi } from '@/store/api/baseApi';

export const useAuth = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const auth = useSelector(selectAuth);
  const [logoutApi] = useLogoutMutation();

  const logout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // Swallow errors — still clear locally
    } finally {
      dispatch(clearCredentials());
      dispatch(baseApi.util.resetApiState()); // Clear RTK Query cache
      router.push('/login');
    }
  };

  return { ...auth, logout };
};
