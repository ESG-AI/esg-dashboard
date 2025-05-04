import { clerkClient } from "@clerk/clerk-sdk-node";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get current user from auth - await the Promise
    const authObject = await auth();
    const { userId } = authObject;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if current user is admin
    const currentUser = await clerkClient.users.getUser(userId);
    const isAdmin = currentUser.publicMetadata?.role === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get all users
    const users = await clerkClient.users.getUserList({
      limit: 100,
    });
    
    // Map to needed fields
    const mappedUsers = users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddress: user.emailAddresses[0]?.emailAddress || '',
      createdAt: user.createdAt,
      isApproved: user.publicMetadata?.isApproved || false
    }));
    
    return NextResponse.json({ users: mappedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}