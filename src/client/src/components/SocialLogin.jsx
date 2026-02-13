import React from 'react';
import GoogleLogin from './GoogleLogin';
import LinkedInLogin from './LinkedInLogin';
import GitHubLogin from './GitHubLogin';

const SocialLogin = ({ onSuccess, onError }) => {
  return (
    <div className="space-y-3">
      <GoogleLogin onSuccess={onSuccess} onError={onError} />
      <LinkedInLogin onSuccess={onSuccess} onError={onError} />
      <GitHubLogin onSuccess={onSuccess} onError={onError} />
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>
    </div>
  );
};

export default SocialLogin;