"use client"; // This component needs client-side interactivity

import { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // For previewing images
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  User,
  updateProfile, // To set display name initially
  AuthError,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, /*storage */} from '@/app/lib/firebase/config'; // Import initialized services

// Helper function for Firebase error codes
const getFirebaseAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email address is already in use.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Contact support.';
    case 'auth/popup-closed-by-user':
        return 'Google Sign-in popup closed before completion.';
    case 'auth/cancelled-popup-request':
        return 'Only one sign-in popup allowed at a time.';
    default:
      return 'An unknown authentication error occurred. Please try again.';
  }
};

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    location: '',
    stateOfOrigin: '',
    interests: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [additionalPics, setAdditionalPics] = useState<File[]>([]);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [additionalPicsPreview, setAdditionalPicsPreview] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePicChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePic(file);
      setProfilePicPreview(URL.createObjectURL(file));
    } else {
      setProfilePic(null);
      setProfilePicPreview(null);
    }
  };

  const handleAdditionalPicsChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 3); // Limit to 3
      setAdditionalPics(files);
      const previews = files.map(file => URL.createObjectURL(file));
      setAdditionalPicsPreview(previews);
    } else {
      setAdditionalPics([]);
      setAdditionalPicsPreview([]);
    }
  };

  // --- Firebase Storage Upload Helper ---
  /*const uploadImage = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (uploadError) {
      console.error("Image Upload Error:", uploadError);
      // Consider more specific error handling based on uploadError.code
      throw new Error(`Failed to upload ${file.name}.`);
    }
  }; */

  // --- Email/Password Signup Handler ---
  const handleEmailSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!profilePic) {
      setError('Profile picture is required.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // 2. Update Firebase Auth Profile (Optional but good practice)
      await updateProfile(user, { displayName: formData.name });

      // 3. Upload Images to Firebase Storage
      let profilePicUrl = '';
      const additionalPicUrls: string[] = [];

      // Upload Profile Picture
      try {
        profilePicUrl = await uploadImage(
          profilePic,
          `users/${user.uid}/profile_${profilePic.name}`
        );
      } catch (uploadError) {
        // Handle profile pic upload failure - maybe delete the user? Or log and alert?
        setError(`Failed to upload profile picture. Registration incomplete. ${uploadError instanceof Error ? uploadError.message : ''}`);
        // Consider deleting the newly created user if profile pic is essential
        // await user.delete();
        setIsLoading(false);
        return;
      }

      // Upload Additional Pictures (best effort)
      for (let i = 0; i < additionalPics.length; i++) {
        try {
          const url = await uploadImage(
            additionalPics[i],
            `users/${user.uid}/additional_${i}_${additionalPics[i].name}`
          );
          additionalPicUrls.push(url);
        } catch (uploadError) {
          console.warn(`Failed to upload additional picture ${i + 1}:`, uploadError);
          // Decide if you want to stop or continue if an additional pic fails
        }
      }

      // 4. TODO: Save User Data (including URLs) to Firestore
      // This is where you'd typically save all formData + image URLs
      // to a 'users' collection in Firestore using the user.uid as the document ID.
      console.log('User created:', user.uid);
      console.log('Profile Pic URL:', profilePicUrl);
      console.log('Additional Pic URLs:', additionalPicUrls);
      console.log('User Data to save:', formData);
      // Example Firestore save (requires setting up Firestore):
      // import { doc, setDoc } from 'firebase/firestore';
      // import { db } from '@/lib/firebase/config';
      // await setDoc(doc(db, 'users', user.uid), {
      //   uid: user.uid,
      //   name: formData.name,
      //   age: parseInt(formData.age, 10) || null, // Store age as number
      //   location: formData.location,
      //   stateOfOrigin: formData.stateOfOrigin,
      //   interests: formData.interests.split(',').map(s => s.trim()).filter(Boolean), // Example: store as array
      //   email: user.email, // Get from auth user object
      //   profilePicUrl: profilePicUrl,
      //   additionalPicUrls: additionalPicUrls,
      //   createdAt: serverTimestamp(), // Requires importing serverTimestamp
      // });


      // 5. Redirect on Success
      router.push('/chat'); // Redirect to chat or profile page after signup

    } catch (authError) {
      console.error('Authentication Error:', authError);
      if (authError instanceof Error && 'code' in authError) {
         setError(getFirebaseAuthErrorMessage((authError as AuthError).code));
      } else {
         setError('An unexpected error occurred during signup.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Google Sign-in Handler ---
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Google Sign-in successful
      console.log('Google Sign-in successful:', user);

      // TODO: Check if this user already exists in your Firestore database.
      // If it's a NEW user via Google, you might redirect them to a
      // page to complete their profile (age, location, pictures etc.)
      // as Google doesn't provide all that info.
      // If it's an EXISTING user, redirect them to the chat.

      // For now, just redirect to chat
      router.push('/chat');

    } catch (authError) {
        console.error('Google Sign-in Error:', authError);
        if (authError instanceof Error && 'code' in authError) {
            setError(getFirebaseAuthErrorMessage((authError as AuthError).code));
        } else {
            setError('An unexpected error occurred during Google Sign-in.');
        }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-md sm:p-10">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Create Your Let's Connect Account
        </h1>

        {error && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-center text-red-700">
            {error}
          </div>
        )}

        {/* --- Email/Password Signup Form --- */}
        <form onSubmit={handleEmailSignup} className="space-y-5">
          {/* Personal Info */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input type="text" id="name" name="name" required value={formData.name} onChange={handleInputChange} className="input-style" placeholder="Your Full Name"/>
            </div>
            <div>
              <label htmlFor="age" className="mb-1 block text-sm font-medium text-gray-700">Age</label>
              <input type="number" id="age" name="age" required min="18" value={formData.age} onChange={handleInputChange} className="input-style" placeholder="e.g., 25"/>
            </div>
            <div>
              <label htmlFor="location" className="mb-1 block text-sm font-medium text-gray-700">Current Location</label>
              <input type="text" id="location" name="location" required value={formData.location} onChange={handleInputChange} className="input-style" placeholder="City, Country"/>
            </div>
            <div>
              <label htmlFor="stateOfOrigin" className="mb-1 block text-sm font-medium text-gray-700">State of Origin (Nigeria)</label>
              <input type="text" id="stateOfOrigin" name="stateOfOrigin" required value={formData.stateOfOrigin} onChange={handleInputChange} className="input-style" placeholder="e.g., Lagos"/>
            </div>
          </div>

          {/* Interests */}
          <div>
            <label htmlFor="interests" className="mb-1 block text-sm font-medium text-gray-700">Interests</label>
            <textarea id="interests" name="interests" rows={3} value={formData.interests} onChange={handleInputChange} className="input-style" placeholder="Separate interests with commas (e.g., Reading, Hiking, Coding)"/>
          </div>

          {/* Image Uploads */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Profile Picture */}
            <div>
              <label htmlFor="profilePic" className="mb-1 block text-sm font-medium text-gray-700">Profile Picture (Required)</label>
              <input type="file" id="profilePic" name="profilePic" required accept="image/*" onChange={handleProfilePicChange} className="input-file-style"/>
              {profilePicPreview && (
                <div className="mt-2">
                  <Image src={profilePicPreview} alt="Profile Preview" width={100} height={100} className="h-24 w-24 rounded-full object-cover"/>
                </div>
              )}
            </div>

            {/* Additional Pictures */}
            <div>
              <label htmlFor="additionalPics" className="mb-1 block text-sm font-medium text-gray-700">Additional Pictures (Up to 3)</label>
              <input type="file" id="additionalPics" name="additionalPics" multiple accept="image/*" onChange={handleAdditionalPicsChange} className="input-file-style"/>
              {additionalPicsPreview.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {additionalPicsPreview.map((preview, index) => (
                    <Image key={index} src={preview} alt={`Additional Preview ${index + 1}`} width={80} height={80} className="h-20 w-20 rounded object-cover"/>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Auth Credentials */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email Address</label>
              <input type="email" id="email" name="email" required value={formData.email} onChange={handleInputChange} className="input-style" placeholder="you@example.com"/>
            </div>
             <div> {/* Empty div for spacing on larger screens */}</div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <input type="password" id="password" name="password" required minLength={6} value={formData.password} onChange={handleInputChange} className="input-style" placeholder="••••••••"/>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">Confirm Password</label>
              <input type="password" id="confirmPassword" name="confirmPassword" required minLength={6} value={formData.confirmPassword} onChange={handleInputChange} className="input-style" placeholder="••••••••"/>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow transition duration-150 ease-in-out hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up with Email'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 flex-shrink text-sm text-gray-500">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* --- Google Sign-in Button --- */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition duration-150 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Basic Google Icon SVG - Replace with a better one if desired */}
          <svg className="h-5 w-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M43.6111 20.0833H42V20H24V28H35.303C34.049 32.657 29.613 36 24 36C17.373 36 12 30.627 12 24C12 17.373 17.373 12 24 12C27.118 12 29.918 13.18 32.084 15.151L37.64 9.594C34.046 6.465 29.305 4.5 24 4.5C13.237 4.5 4.5 13.237 4.5 24C4.5 34.763 13.237 43.5 24 43.5C34.763 43.5 43.5 34.763 43.5 24C43.5 22.512 43.556 21.29 43.6111 20.0833Z" fill="#FFC107"/>
            <path d="M6.306 14.691L12.18 19.06C13.614 15.718 16.628 13.5 20.25 13.5H24V4.5H24C18.695 4.5 14.046 6.465 10.44 9.594L4.884 4.038C7.78 1.599 11.625 0 16 0H24V12H24C20.373 12 17.373 14.627 16.306 18.691L6.306 14.691Z" fill="#FF3D00"/>
            <path d="M24 43.5C29.405 43.5 33.954 41.535 37.56 38.406L31.916 33.94C30.482 35.282 28.372 36 26.25 36H24V28H35.303C35.171 29.737 34.524 31.349 33.451 32.691L37.56 38.406C40.454 35.967 42.375 32.375 43.5 28H43.5V24C43.5 34.763 34.763 43.5 24 43.5Z" fill="#4CAF50"/>
            <path d="M43.6111 20.0833H42V20H24V28H35.303C34.776 29.601 33.886 31.01 32.71 32.151L38.29 37.709C37.954 38.046 37.56 38.406 37.56 38.406L31.916 33.94C30.482 35.282 28.372 36 26.25 36H24C17.373 36 12 30.627 12 24C12 17.373 17.373 12 24 12C27.118 12 29.918 13.18 32.084 15.151L37.64 9.594C34.046 6.465 29.305 4.5 24 4.5C13.237 4.5 4.5 13.237 4.5 24C4.5 34.763 13.237 43.5 24 43.5C34.763 43.5 43.5 34.763 43.5 24C43.5 22.512 43.556 21.29 43.6111 20.0833Z" fill="#1976D2"/>
          </svg>
          {isLoading ? 'Signing In...' : 'Sign Up with Google'}
        </button>

        {/* Login Link */}
        <p className="mt-8 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
            Log in here
          </Link>
        </p>
      </div>

      {/* Simple CSS-in-JS for input styles to avoid repetition */}
      <style jsx>{`
        .input-style {
          @apply w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm;
        }
        .input-file-style {
          @apply block w-full text-sm text-gray-500
            file:mr-4 file:rounded-md file:border-0
            file:bg-indigo-50 file:px-4 file:py-2
            file:text-sm file:font-semibold file:text-indigo-700
            hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed;
        }
      `}</style>
    </main>
  );
}