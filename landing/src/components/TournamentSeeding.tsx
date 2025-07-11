'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/app/components/ToastContext';

interface Participant {
  id: number;
  display_name: string;
  profile_picture: string | null;
  seed?: number;
}

interface TournamentSeedingProps {
  tournamentId: number;
  participants: Participant[];
  onSeedingComplete: () => void;
}

export default function TournamentSeeding({ 
  tournamentId, 
  participants: initialParticipants,
  onSeedingComplete 
}: TournamentSeedingProps) {
  const [participants, setParticipants] = useState<Participant[]>(
    initialParticipants.map((p, index) => ({ ...p, seed: index + 1 }))
  );
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(participants);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update seeds after reordering
    const updatedItems = items.map((item, index) => ({
      ...item,
      seed: index + 1
    }));

    setParticipants(updatedItems);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Get auth token for authentication
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`https://backend-6wqj.onrender.com/tournaments/${tournamentId}/seeds`, {
        method: 'PUT',
        headers,
        credentials: 'include',        body: JSON.stringify({
          seeds: Object.fromEntries(participants.map(p => [p.id, p.seed]))
        }),
      });

      if (res.ok) {
        showToast({
          title: 'Success',
          message: 'Tournament seeding updated successfully',
          type: 'success'
        });
        onSeedingComplete();
      } else {
        const error = await res.json();
        showToast({
          title: 'Error',
          message: error.message || 'Failed to update seeding',
          type: 'error'
        });
      }
    } catch (err) {
      showToast({
        title: 'Error',
        message: 'Error updating tournament seeding',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Tournament Seeding</h2>
      <p className="mb-4 text-gray-600">
        Drag and drop participants to set their seeds. Seed #1 will face the lowest seed in their bracket,
        #2 will face the second-lowest, and so on.
      </p>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="participants">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {participants.map((participant, index) => (
                <Draggable 
                  key={participant.id.toString()} 
                  draggableId={participant.id.toString()} 
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="flex items-center p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 cursor-move"
                    >
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center font-semibold text-gray-500 bg-gray-200 rounded mr-3">
                        {index + 1}
                      </div>
                      
                      <div className="flex items-center">
                        {participant.profile_picture ? (
                          <img
                            src={participant.profile_picture}
                            alt={participant.display_name}
                            className="w-8 h-8 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 rounded-full mr-3" />
                        )}
                        <span className="font-medium">{participant.display_name}</span>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isSubmitting ? 'Saving...' : 'Save Seeding'}
        </button>
      </div>
    </div>
  );
}
