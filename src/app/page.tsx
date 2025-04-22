import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-stretch"> {/* Use items-stretch to make columns potentially full height */}

      {/* Left Column: Image (Hidden on mobile, visible md and up) */}
      <div className="hidden md:block md:w-1/2 relative bg-gray-100"> {/* Added relative positioning and bg color */}
        <Image
          // Replace with your actual image path in the /public folder or a remote URL
          src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" // Example image
          alt="People connecting and chatting"
          fill // Use fill to cover the container
          style={{ objectFit: 'cover' }} // Ensure image covers the area without distortion
          priority // Prioritize loading this image as it's likely LCP on desktop
        />
        {/* Optional: Add an overlay or text on top of the image if needed */}
        {/* <div className="absolute inset-0 bg-black bg-opacity-20"></div> */}
      </div>

      {/* Right Column: Login Form / Signup Link (Full width on mobile, half width md and up) */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 bg-white">
        <div className="w-full max-w-md"> {/* Limit form width for better readability */}
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
            Connect Instantly
          </h1>
          <p className="mb-8 text-center text-gray-600">
            Log in to start chatting with friends and new people.
          </p>

          {/* Login Form */}
          <form className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>
            {/* Optional: Add forgot password link here */}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              Log In
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Do not have an account?{' '}
            <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
