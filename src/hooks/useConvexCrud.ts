/**
 * React hooks wrapping Convex CRUD — keeps screens free of string function names.
 */
import { useMutation, useQuery } from "convex/react";
import { api } from "@/lib/convexApi";
import type { Id } from "../../convex/_generated/dataModel";

function listArgs(limit?: number) {
  return { limit: limit ?? 100 };
}

/* users */
export function useUser(id: Id<"users"> | undefined) {
  return useQuery(api.crudQueries.getUser, id ? { id } : "skip");
}

export function useUsersList(limit?: number) {
  return useQuery(api.crudQueries.listUsers, listArgs(limit));
}

export function useAddUser() {
  return useMutation(api.crudMutations.addUser);
}

export function useDeleteUser() {
  return useMutation(api.crudMutations.deleteUser);
}

/* study_groups */
export function useStudyGroup(id: Id<"study_groups"> | undefined) {
  return useQuery(api.crudQueries.getStudyGroup, id ? { id } : "skip");
}

export function useStudyGroupsList(limit?: number) {
  return useQuery(api.crudQueries.listStudyGroups, listArgs(limit));
}

export function useAddStudyGroup() {
  return useMutation(api.crudMutations.addStudyGroup);
}

export function useDeleteStudyGroup() {
  return useMutation(api.crudMutations.deleteStudyGroup);
}

/* study_group_members */
export function useStudyGroupMember(id: Id<"study_group_members"> | undefined) {
  return useQuery(api.crudQueries.getStudyGroupMember, id ? { id } : "skip");
}

export function useStudyGroupMembersList(limit?: number) {
  return useQuery(api.crudQueries.listStudyGroupMembers, listArgs(limit));
}

export function useAddStudyGroupMember() {
  return useMutation(api.crudMutations.addStudyGroupMember);
}

export function useDeleteStudyGroupMember() {
  return useMutation(api.crudMutations.deleteStudyGroupMember);
}

/* study_sessions */
export function useStudySession(id: Id<"study_sessions"> | undefined) {
  return useQuery(api.crudQueries.getStudySession, id ? { id } : "skip");
}

export function useStudySessionsList(limit?: number) {
  return useQuery(api.crudQueries.listStudySessions, listArgs(limit));
}

export function useAddStudySession() {
  return useMutation(api.crudMutations.addStudySession);
}

export function useDeleteStudySession() {
  return useMutation(api.crudMutations.deleteStudySession);
}

/* session_participants */
export function useSessionParticipant(id: Id<"session_participants"> | undefined) {
  return useQuery(api.crudQueries.getSessionParticipant, id ? { id } : "skip");
}

export function useSessionParticipantsList(limit?: number) {
  return useQuery(api.crudQueries.listSessionParticipants, listArgs(limit));
}

export function useAddSessionParticipant() {
  return useMutation(api.crudMutations.addSessionParticipant);
}

export function useDeleteSessionParticipant() {
  return useMutation(api.crudMutations.deleteSessionParticipant);
}

/* forum_posts */
export function useForumPost(id: Id<"forum_posts"> | undefined) {
  return useQuery(api.crudQueries.getForumPost, id ? { id } : "skip");
}

export function useForumPostsList(limit?: number) {
  return useQuery(api.crudQueries.listForumPosts, listArgs(limit));
}

export function useAddForumPost() {
  return useMutation(api.crudMutations.addForumPost);
}

export function useDeleteForumPost() {
  return useMutation(api.crudMutations.deleteForumPost);
}

/** Prefer `forum` module for product flows (auth, sorting, resolve). */
export function useForumPostsMvp(filters?: { subject?: string; limit?: number }) {
  return useQuery(api.forum.getPosts, {
    limit: filters?.limit ?? 40,
    ...(filters?.subject !== undefined ? { subject: filters.subject } : {})
  });
}

export function useCreateForumPost() {
  return useMutation(api.forum.createPost);
}

export function useMarkForumPostResolved() {
  return useMutation(api.forum.markPostResolved);
}

export function useSeedForumExamples() {
  return useMutation(api.forum.seedExampleForumPosts);
}

export function useForumResponsesForPost(postId: Id<"forum_posts"> | undefined) {
  return useQuery(api.forum.getResponsesForPost, postId ? { postId } : "skip");
}

export function useForumResponseCounts(postIds: Id<"forum_posts">[] | undefined) {
  return useQuery(api.forum.getResponseCounts, postIds && postIds.length > 0 ? { postIds } : "skip");
}

export function useCreateForumResponse() {
  return useMutation(api.forum.createResponse);
}

/* study_spots */
export function useStudySpot(id: Id<"study_spots"> | undefined) {
  return useQuery(api.crudQueries.getStudySpot, id ? { id } : "skip");
}

export function useStudySpotsList(limit?: number) {
  return useQuery(api.crudQueries.listStudySpots, listArgs(limit));
}

export function useAddStudySpot() {
  return useMutation(api.crudMutations.addStudySpot);
}

export function useDeleteStudySpot() {
  return useMutation(api.crudMutations.deleteStudySpot);
}

/* cafe_locations */
export function useCafeLocation(id: Id<"cafe_locations"> | undefined) {
  return useQuery(api.crudQueries.getCafeLocation, id ? { id } : "skip");
}

export function useCafeLocationsList(limit?: number) {
  return useQuery(api.crudQueries.listCafeLocations, listArgs(limit));
}

export function useAddCafeLocation() {
  return useMutation(api.crudMutations.addCafeLocation);
}

export function useDeleteCafeLocation() {
  return useMutation(api.crudMutations.deleteCafeLocation);
}

/* cafe_seat_holds */
export function useCafeSeatHold(id: Id<"cafe_seat_holds"> | undefined) {
  return useQuery(api.crudQueries.getCafeSeatHold, id ? { id } : "skip");
}

export function useCafeSeatHoldsList(limit?: number) {
  return useQuery(api.crudQueries.listCafeSeatHolds, listArgs(limit));
}

export function useAddCafeSeatHold() {
  return useMutation(api.crudMutations.addCafeSeatHold);
}

export function useDeleteCafeSeatHold() {
  return useMutation(api.crudMutations.deleteCafeSeatHold);
}

/* reservations */
export function useReservation(id: Id<"reservations"> | undefined) {
  return useQuery(api.crudQueries.getReservation, id ? { id } : "skip");
}

export function useReservationsList(limit?: number) {
  return useQuery(api.crudQueries.listReservations, listArgs(limit));
}

export function useAddReservation() {
  return useMutation(api.crudMutations.addReservation);
}

export function useDeleteReservation() {
  return useMutation(api.crudMutations.deleteReservation);
}

/* coupon_purchases */
export function useCouponPurchase(id: Id<"coupon_purchases"> | undefined) {
  return useQuery(api.crudQueries.getCouponPurchase, id ? { id } : "skip");
}

export function useCouponPurchasesList(limit?: number) {
  return useQuery(api.crudQueries.listCouponPurchases, listArgs(limit));
}

export function useAddCouponPurchase() {
  return useMutation(api.crudMutations.addCouponPurchase);
}

export function useDeleteCouponPurchase() {
  return useMutation(api.crudMutations.deleteCouponPurchase);
}
