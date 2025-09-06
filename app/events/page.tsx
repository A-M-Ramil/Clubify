"use client";

import React, { useEffect, useState } from "react";
import { Calendar, MapPin, University } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/UI/card";
import EventModal from "@/components/EventModal";
import { Button } from "@/components/UI/button";

interface EventImage {
  url: string;
}

interface Club {
  name: string;
  university: string;
  coverImage: string | null;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  location: string | null;
  club: Club;
  images: EventImage[];
}

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [globalRole, setGlobalRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventsAndRole = async () => {
      try {
        const [eventsResponse, roleResponse] = await Promise.all([
          fetch("/api/events"),
          fetch("/api/user-role"),
        ]);

        const eventsResult = await eventsResponse.json();
        const roleResult = await roleResponse.json();

        if (!eventsResponse.ok) {
          throw new Error(eventsResult.error || "Failed to fetch events");
        }
        if (!roleResponse.ok) {
          throw new Error(roleResult.error || "Failed to fetch user role");
        }

        setEvents(eventsResult.data);
        setGlobalRole(roleResult.globalRole);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchEventsAndRole();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  const handleDetailsClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            University Club Events
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Discover what's happening across all clubs and universities. Open to everyone.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        )}

        {error && (
          <div className="text-center text-red-400 text-lg">
            <p>Error loading events: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <Card key={event.id} className="bg-neutral-900 border-neutral-800 overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 ease-in-out flex flex-col">
                <div className="relative h-48 w-full">
                  <img
                    src={event.images[0]?.url || event.club.coverImage || '/W.png'}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40"></div>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-purple-300">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm flex-grow">
                  <div className="flex items-center text-gray-300">
                    <University className="h-4 w-4 mr-2 text-purple-400" />
                    <span>{event.club.name} - {event.club.university}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                    <span>{formatDate(event.startDate)}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center text-gray-300">
                      <MapPin className="h-4 w-4 mr-2 text-purple-400" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.description && (
                     <p className="text-gray-400 pt-2 line-clamp-3">
                        {event.description}
                     </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={() => handleDetailsClick(event)} className="w-full">Details</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && events.length === 0 && (
            <div className="text-center text-gray-500 mt-16">
                <h2 className="text-2xl font-semibold">No Events Found</h2>
                <p className="mt-2">Check back later for new and exciting events!</p>
            </div>
        )}
      </div>
      {selectedEvent && (
        <EventModal
          open={isModalOpen}
          setOpen={setIsModalOpen}
          event={selectedEvent}
          globalRole={globalRole}
        />
      )}
    </div>
  );
};

export default EventsPage;
