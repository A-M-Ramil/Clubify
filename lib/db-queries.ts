import {
  PrismaClient,
  GlobalRole,
  ClubRole,
  RSVPStatus,
  SponsorshipStatus,
  PaymentMethod,
} from "@prisma/client";
import { get } from "http";

const prisma = new PrismaClient();

// =====================================================
// USER QUERIES
// =====================================================

export const userQueries = {
  // Create new user
  createUser: async (data: {
    authUserId: string;
    email: string;
    name: string;
    globalRole?: GlobalRole;
  }) => {
    return await prisma.user.create({
      data: {
        ...data,
        globalRole: data.globalRole || GlobalRole.MEMBER,
      },
    });
  },
  getUserClubs: async (userId: string) => {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            club: true,
            department: true,
          },
        },
        clubs: true,
      },
    });
  },
  // Get user by auth ID
  getUserByAuthId: async (authUserId: string) => {
    return await prisma.user.findUnique({
      where: { authUserId },
      include: {
        memberships: {
          include: {
            club: true,
            department: true,
          },
        },
        clubs: true, // clubs they admin
        sponsorProfile: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  getwholeprofile: async (userId: string) => {
    return await prisma.user.findUnique({
      where: { authUserId: userId },
      include: {
        memberships: {
          include: {
            club: true,
            department: true,
          },
        },
        clubs: true, // clubs they admin
        sponsorProfile: true,
        sponsorships: {
          include: {
            event: {
              include: {
                club: true,
              },
            },
          },
        },
        rsvps: {
          include: {
            event: {
              include: {
                club: true,
              },
            },
          },
          orderBy: {
            event: {
              startDate: "desc",
            },
          },
        },
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },
  updateUserProfile: async (userId: string, validatedData: any) => {
    return await prisma.user.update({
      where: { authUserId: userId },
      data: {
        name: validatedData.name,
        email: validatedData.email,
      },
      include: {
        memberships: {
          include: {
            club: true,
            department: true,
          },
        },
        clubs: true,
        sponsorProfile: true,
        sponsorships: true,
        rsvps: {
          include: {
            event: {
              include: {
                club: true,
              },
            },
          },
        },
      },
    });
  },
  // Get user by ID with full details
  getUserById: async (id: string) => {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            club: true,
            department: true,
          },
        },
        clubs: true,
        sponsorProfile: true,
        sponsorships: true,
        rsvps: {
          include: {
            event: true,
          },
        },
      },
    });
  },

  // Update user
  updateUser: async (
    id: string,
    data: {
      name?: string;
      email?: string;
      globalRole?: GlobalRole;
    }
  ) => {
    return await prisma.user.update({
      where: { id },
      data,
    });
  },

  // Get all users with pagination
  getAllUsers: async (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    return await prisma.user.findMany({
      skip,
      take: limit,
      include: {
        memberships: {
          include: {
            club: true,
          },
        },
        sponsorProfile: true,
      },
    });
  },

  // Search users by name or email
  searchUsers: async (query: string) => {
    return await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        memberships: {
          include: {
            club: true,
          },
        },
      },
    });
  },
};

// =====================================================
// CLUB QUERIES
// =====================================================

export const clubQueries = {
  // Create club (will need approval later)
  createClub: async (data: {
    name: string;
    university: string;
    description?: string;
    contactEmail?: string;
    website?: string;
    coverImage?: string;
    creatorId: string; // Database user ID (not Clerk ID)
  }) => {
    // First verify that the user exists
    const user = await prisma.user.findUnique({
      where: { id: data.creatorId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return await prisma.club.create({
      data: {
        name: data.name,
        university: data.university,
        description: data.description,
        contactEmail: data.contactEmail,
        website: data.website,
        coverImage: data.coverImage,
        admins: {
          connect: { id: data.creatorId },
        },
        members: {
          create: {
            userId: data.creatorId,
            role: ClubRole.PRESIDENT,
          },
        },
      },
      include: {
        admins: true,
        members: {
          include: {
            user: true,
            department: true,
          },
        },
      },
    });
  },
  // Get club by ID with full details
  getClubById: async (id: string) => {
    return await prisma.club.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: true,
            department: true,
          },
        },
        departments: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        events: {
          include: {
            rsvps: true,
            sponsorships: true,
          },
        },
        admins: true,
      },
    });
  },

  // Get all clubs under a university
  getClubsByUniversity: async (university: string) => {
    return await prisma.club.findMany({
      where: {
        university: {
          contains: university,
          mode: "insensitive",
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        events: true,
        departments: true,
      },
    });
  },

  // Get all clubs (with pagination)
  getAllClubs: async (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    return await prisma.club.findMany({
      skip,
      take: limit,
      include: {
        members: {
          include: {
            user: true,
          },
        },
        events: true,
        departments: true,
      },
    });
  },

  // Get all members of a club
  getClubMembers: async (clubId: string) => {
    return await prisma.membership.findMany({
      where: { clubId },
      include: {
        user: true,
        department: true,
      },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    });
  },

  // Get all departments of a club
  getClubDepartments: async (clubId: string) => {
    return await prisma.department.findMany({
      where: { clubId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        events: true,
      },
    });
  },

  // Update club
  updateClub: async (
    id: string,
    data: {
      name?: string;
      university?: string;
      description?: string;
      contactEmail?: string;
      website?: string;
      coverImage?: string;
    }
  ) => {
    return await prisma.club.update({
      where: { id },
      data,
    });
  },

  // Search clubs
  searchClubs: async (query: string) => {
    return await prisma.club.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { university: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { contactEmail: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        members: true,
        events: true,
      },
    });
  },

  // Get club by contact email
  getClubByContactEmail: async (contactEmail: string) => {
    return await prisma.club.findFirst({
      where: { contactEmail },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        admins: true,
        departments: true,
      },
    });
  },

  // Get clubs with cover images (for gallery/showcase)
  getClubsWithImages: async () => {
    return await prisma.club.findMany({
      where: {
        coverImage: {
          not: null,
        },
      },
      include: {
        members: true,
        events: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // Get club basic info (for dropdowns/selections)
  getClubBasicInfo: async () => {
    return await prisma.club.findMany({
      select: {
        id: true,
        name: true,
        university: true,
        coverImage: true,
        _count: {
          select: {
            members: true,
            events: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  },
};

export const membershipQueries = {
  // Add member to club
  addMemberToClub: async (data: {
    userId: string;
    clubId: string;
    role?: ClubRole;
    departmentId?: string;
  }) => {
    return await prisma.membership.create({
      data: {
        userId: data.userId,
        clubId: data.clubId,
        role: data.role || ClubRole.MEMBER,
        departmentId: data.departmentId,
      },
      include: {
        user: true,
        club: true,
        department: true,
      },
    });
  },

  // Get membership details
  getMembership: async (userId: string, clubId: string) => {
    return await prisma.membership.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
      include: {
        user: true,
        club: true,
        department: true,
      },
    });
  },

  // Update member role
  updateMemberRole: async (userId: string, clubId: string, role: ClubRole) => {
    return await prisma.membership.update({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
      data: { role },
    });
  },

  // Remove member from club
  removeMemberFromClub: async (userId: string, clubId: string) => {
    return await prisma.membership.delete({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
    });
  },

  // Get all members in a department
  getDepartmentMembers: async (departmentId: string) => {
    return await prisma.membership.findMany({
      where: { departmentId },
      include: {
        user: true,
        club: true,
      },
    });
  },

  // Get user's memberships
  getUserMemberships: async (userId: string) => {
    return await prisma.membership.findMany({
      where: { userId },
      include: {
        club: true,
        department: true,
      },
    });
  },
};

// =====================================================
// DEPARTMENT QUERIES
// =====================================================

export const departmentQueries = {
  // Create department
  createDepartment: async (data: { name: string; clubId: string }) => {
    return await prisma.department.create({
      data,
      include: {
        club: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  },

  // Get department by ID
  getDepartmentById: async (id: string) => {
    return await prisma.department.findUnique({
      where: { id },
      include: {
        club: true,
        members: {
          include: {
            user: true,
          },
        },
        events: true,
      },
    });
  },

  // Update department
  updateDepartment: async (id: string, data: { name?: string }) => {
    return await prisma.department.update({
      where: { id },
      data,
    });
  },

  // Delete department
  deleteDepartment: async (id: string) => {
    return await prisma.department.delete({
      where: { id },
    });
  },
};

// =====================================================
// EVENT QUERIES
// =====================================================

export const eventQueries = {
  // Create event
  createEvent: async (data: {
    clubId: string;
    departmentId?: string;
    title: string;
    description?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    startDate: Date;
    endDate?: Date;
    imageUrl?: string;
  }) => {
    const { imageUrl, ...eventData } = data;
    return await prisma.event.create({
      data: {
        ...eventData,
        images: imageUrl ? {
          create: [{ url: imageUrl }],
        } : undefined,
      },
      include: {
        club: true,
        department: true,
        images: true,
      },
    });
  },

  // Get ongoing events (for dashboard)
  getOngoingEvents: async () => {
    const now = new Date();
    return await prisma.event.findMany({
      where: {
        startDate: { lte: now },
        OR: [{ endDate: { gte: now } }, { endDate: null }],
      },
      include: {
        club: true,
        department: true,
        images: true,
        rsvps: {
          include: {
            user: true,
          },
        },
        sponsorships: true,
      },
      orderBy: { startDate: "asc" },
    });
  },

  // Get upcoming events
  getUpcomingEvents: async (limit?: number) => {
    const now = new Date();
    return await prisma.event.findMany({
      where: {
        startDate: { gt: now },
      },
      include: {
        club: true,
        department: true,
        images: true,
        rsvps: true,
      },
      orderBy: { startDate: "asc" },
      take: limit,
    });
  },

  // Get events by club
  getClubEvents: async (clubId: string) => {
    return await prisma.event.findMany({
      where: { clubId },
      include: {
        department: true,
        images: true,
        rsvps: {
          include: {
            user: true,
          },
        },
        sponsorships: true,
      },
      orderBy: { startDate: "desc" },
    });
  },

  // Get events by department
  getDepartmentEvents: async (departmentId: string) => {
    return await prisma.event.findMany({
      where: { departmentId },
      include: {
        club: true,
        images: true,
        rsvps: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });
  },

  // Get event by ID
  getEventById: async (id: string) => {
    return await prisma.event.findUnique({
      where: { id },
      include: {
        club: true,
        department: true,
        images: true,
        rsvps: {
          include: {
            user: true,
          },
        },
        sponsorships: {
          include: {
            sponsor: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  },

  // Update event
  updateEvent: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      location?: string;
      latitude?: number;
      longitude?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ) => {
    return await prisma.event.update({
      where: { id },
      data,
    });
  },

  // Delete event
  deleteEvent: async (id: string) => {
    return await prisma.event.delete({
      where: { id },
    });
  },

  // Search events
  searchEvents: async (query: string) => {
    return await prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { location: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        club: true,
        department: true,
        images: true,
      },
    });
  },
};

// =====================================================
// RSVP QUERIES
// =====================================================

export const rsvpQueries = {
  // Create or update RSVP
  upsertRSVP: async (data: {
    eventId: string;
    userId: string;
    status: RSVPStatus;
  }) => {
    return await prisma.rSVP.upsert({
      where: {
        eventId_userId: {
          eventId: data.eventId,
          userId: data.userId,
        },
      },
      update: {
        status: data.status,
      },
      create: data,
      include: {
        event: true,
        user: true,
      },
    });
  },

  // Get RSVPs for an event
  getEventRSVPs: async (eventId: string) => {
    return await prisma.rSVP.findMany({
      where: { eventId },
      include: {
        user: true,
      },
      orderBy: { user: { name: "asc" } },
    });
  },

  // Get user's RSVPs
  getUserRSVPs: async (userId: string) => {
    return await prisma.rSVP.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            club: true,
          },
        },
      },
      orderBy: { event: { startDate: "desc" } },
    });
  },

  // Get RSVP count by status for event
  getRSVPCounts: async (eventId: string) => {
    return await prisma.rSVP.groupBy({
      by: ["status"],
      where: { eventId },
      _count: true,
    });
  },
};

// =====================================================
// SPONSOR QUERIES
// =====================================================

export const sponsorQueries = {
  // Create sponsor profile
  createSponsorProfile: async (data: {
    userId: string;
    companyName: string;
    industry?: string;
    location?: string;
  }) => {
    return await prisma.sponsorProfile.create({
      data,
      include: {
        user: true,
      },
    });
  },

  // Get sponsor profile
  getSponsorProfile: async (userId: string) => {
    return await prisma.sponsorProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        sponsorships: {
          include: {
            event: {
              include: {
                club: true,
              },
            },
            payments: true,
          },
        },
      },
    });
  },

  // Update sponsor profile
  updateSponsorProfile: async (
    userId: string,
    data: {
      companyName?: string;
      industry?: string;
      location?: string;
    }
  ) => {
    return await prisma.sponsorProfile.update({
      where: { userId },
      data,
    });
  },

  // Get all sponsors
  getAllSponsors: async () => {
    return await prisma.sponsorProfile.findMany({
      include: {
        user: true,
        sponsorships: {
          include: {
            event: true,
          },
        },
      },
    });
  },

  // Search sponsors
  searchSponsors: async (query: string) => {
    return await prisma.sponsorProfile.findMany({
      where: {
        OR: [
          { companyName: { contains: query, mode: "insensitive" } },
          { industry: { contains: query, mode: "insensitive" } },
          { location: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        user: true,
      },
    });
  },
};

// =====================================================
// SPONSORSHIP QUERIES
// =====================================================

export const sponsorshipQueries = {
  // Create sponsorship
  createSponsorship: async (data: {
    eventId: string;
    sponsorId: string;
    userId: string;
    amount: number;
    status?: SponsorshipStatus;
  }) => {
    return await prisma.sponsorship.create({
      data: {
        ...data,
        status: data.status || SponsorshipStatus.PENDING,
      },
      include: {
        event: {
          include: {
            club: true,
          },
        },
        sponsor: {
          include: {
            user: true,
          },
        },
        user: true,
      },
    });
  },

  // Get sponsorship by ID
  getSponsorshipById: async (id: string) => {
    return await prisma.sponsorship.findUnique({
      where: { id },
      include: {
        event: {
          include: {
            club: true,
          },
        },
        sponsor: {
          include: {
            user: true,
          },
        },
        user: true,
        payments: true,
      },
    });
  },

  // Update sponsorship status
  updateSponsorshipStatus: async (id: string, status: SponsorshipStatus) => {
    return await prisma.sponsorship.update({
      where: { id },
      data: { status },
    });
  },

  // Get sponsorships by event
  getEventSponsorships: async (eventId: string) => {
    return await prisma.sponsorship.findMany({
      where: { eventId },
      include: {
        sponsor: {
          include: {
            user: true,
          },
        },
        payments: true,
      },
    });
  },

  // Get sponsorships by sponsor
  getSponsorSponsorships: async (sponsorId: string) => {
    return await prisma.sponsorship.findMany({
      where: { sponsorId },
      include: {
        event: {
          include: {
            club: true,
          },
        },
        payments: true,
      },
    });
  },

  // Get pending sponsorships
  getPendingSponsorships: async () => {
    return await prisma.sponsorship.findMany({
      where: { status: SponsorshipStatus.PENDING },
      include: {
        event: {
          include: {
            club: true,
          },
        },
        sponsor: {
          include: {
            user: true,
          },
        },
      },
    });
  },
};

// =====================================================
// PAYMENT QUERIES
// =====================================================

export const paymentQueries = {
  // Create payment
  createPayment: async (data: {
    sponsorshipId: string;
    method: PaymentMethod;
    amount: number;
  }) => {
    return await prisma.payment.create({
      data,
      include: {
        sponsorship: {
          include: {
            event: true,
            sponsor: true,
          },
        },
      },
    });
  },

  // Get payments by sponsorship
  getSponsorshipPayments: async (sponsorshipId: string) => {
    return await prisma.payment.findMany({
      where: { sponsorshipId },
      orderBy: { createdAt: "desc" },
    });
  },

  // Get all payments with pagination
  getAllPayments: async (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    return await prisma.payment.findMany({
      skip,
      take: limit,
      include: {
        sponsorship: {
          include: {
            event: true,
            sponsor: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },
};

// =====================================================
// MESSAGE QUERIES
// =====================================================

export const messageQueries = {
  // Send message
  sendMessage: async (data: {
    senderId: string;
    receiverId: string;
    content: string;
  }) => {
    return await prisma.message.create({
      data,
      include: {
        sender: true,
        receiver: true,
      },
    });
  },

  // Get conversation between two users
  getConversation: async (
    userId1: string,
    userId2: string,
    limit: number = 50
  ) => {
    return await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      include: {
        sender: true,
        receiver: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  // Get user's recent conversations
  getRecentConversations: async (userId: string) => {
    return await prisma.$queryRaw`
      SELECT DISTINCT ON (CASE WHEN sender_id = ${userId} THEN receiver_id ELSE sender_id END)
        m.*,
        sender.name as sender_name,
        receiver.name as receiver_name
      FROM "Message" m
      JOIN "User" sender ON m.sender_id = sender.id
      JOIN "User" receiver ON m.receiver_id = receiver.id
      WHERE m.sender_id = ${userId} OR m.receiver_id = ${userId}
      ORDER BY CASE WHEN sender_id = ${userId} THEN receiver_id ELSE sender_id END, m.created_at DESC
      LIMIT 20
    `;
  },

  // Get unread message count
  getUnreadMessageCount: async (userId: string) => {
    // Note: You might want to add a 'read' field to Message model for this
    return await prisma.message.count({
      where: {
        receiverId: userId,
        // Add read: false when you implement the read field
      },
    });
  },
};

// =====================================================
// RBAC QUERIES
// =====================================================

export const rbacQueries = {
  // Create role
  createRole: async (data: {
    name: string;
    description?: string;
    permissionIds?: string[];
  }) => {
    return await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissionIds
          ? {
              create: data.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  },

  // Create permission
  createPermission: async (data: { name: string }) => {
    return await prisma.permission.create({ data });
  },

  // Assign role to user
  assignRoleToUser: async (userId: string, roleId: string) => {
    return await prisma.userRole.create({
      data: { userId, roleId },
      include: {
        user: true,
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  },

  // Get user permissions
  getUserPermissions: async (userId: string) => {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissions = userRoles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission)
    );

    return Array.from(new Set(permissions.map((p) => p.name)));
  },

  // Check if user has permission
  checkUserPermission: async (
    userId: string,
    permissionName: string
  ): Promise<boolean> => {
    const permissions = await rbacQueries.getUserPermissions(userId);
    return permissions.includes(permissionName);
  },
};

// =====================================================
// ANALYTICS QUERIES
// =====================================================

export const analyticsQueries = {
  // Get dashboard stats
  getDashboardStats: async () => {
    const [totalUsers, totalClubs, totalEvents, ongoingEvents] =
      await Promise.all([
        prisma.user.count(),
        prisma.club.count(),
        prisma.event.count(),
        prisma.event.count({
          where: {
            startDate: { lte: new Date() },
            OR: [{ endDate: { gte: new Date() } }, { endDate: null }],
          },
        }),
      ]);

    return {
      totalUsers,
      totalClubs,
      totalEvents,
      ongoingEvents,
    };
  },

  // Get club statistics
  getClubStats: async (clubId: string) => {
    const [memberCount, eventCount, departmentCount, upcomingEvents] =
      await Promise.all([
        prisma.membership.count({ where: { clubId } }),
        prisma.event.count({ where: { clubId } }),
        prisma.department.count({ where: { clubId } }),
        prisma.event.count({
          where: {
            clubId,
            startDate: { gt: new Date() },
          },
        }),
      ]);

    return {
      memberCount,
      eventCount,
      departmentCount,
      upcomingEvents,
    };
  },

  // Get monthly event statistics
  getMonthlyEventStats: async (year: number) => {
    return await prisma.$queryRaw`
      SELECT 
        EXTRACT(MONTH FROM start_date) as month,
        COUNT(*) as event_count
      FROM "Event"
      WHERE EXTRACT(YEAR FROM start_date) = ${year}
      GROUP BY EXTRACT(MONTH FROM start_date)
      ORDER BY month
    `;
  },

  // Get top clubs by member count
  getTopClubsByMembers: async (limit: number = 10) => {
    return await prisma.$queryRaw`
      SELECT 
        c.*,
        COUNT(m.id) as member_count
      FROM "Club" c
      LEFT JOIN "Membership" m ON c.id = m.club_id
      GROUP BY c.id
      ORDER BY member_count DESC
      LIMIT ${limit}
    `;
  },
};

export { prisma };

// Export all query modules
export default {
  userQueries,
  clubQueries,
  membershipQueries,
  departmentQueries,
  eventQueries,
  rsvpQueries,
  sponsorQueries,
  sponsorshipQueries,
  paymentQueries,
  messageQueries,
  rbacQueries,
  analyticsQueries,
};
