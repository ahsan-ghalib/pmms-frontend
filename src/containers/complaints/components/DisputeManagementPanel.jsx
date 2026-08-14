"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, MessageCircle, Bot, Gavel, Send, Paperclip } from "lucide-react";
import { LoadingSpinner } from "@/helper/Loader";
import { useTranslations } from "next-intl";

export default function DisputeManagementPanel({
  complaint,
  onWorkflowAction,
  onSendMessage,
  onFinalDecision,
}) {
  const t = useTranslations("common");
  const chatRef = useRef(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [finalStatus, setFinalStatus] = useState("");
  const [finalNotes, setFinalNotes] = useState(complaint?.admin_notes || "");

  const isChatClosed = !!complaint?.chat_closed_at;
  const discussionDone = !!complaint?.discussion_completed_at;
  const aiDone = !!complaint?.ai_used_at;
  const decisionDone = !!complaint?.decision_made_at;
  const isTerminal = ["resolved", "rejected"].includes(complaint?.status);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [complaint?.chatMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    await onSendMessage(message);
    setMessage("");
    setSending(false);
  };

  const handleFinalDecision = async (e) => {
    e.preventDefault();
    if (!finalStatus) return;
    if (window.confirm(t("confirm_final_decision") || "This will finalize the complaint. Are you sure?")) {
      await onFinalDecision({ status: finalStatus, final_notes: finalNotes });
    }
  };

  return (
    <Card className="mb-6 border-slate-300 dark:border-zinc-700 shadow-md">
      <CardHeader className="bg-gradient-to-r from-teal-700 to-teal-900 text-white border-b flex flex-row items-center justify-between rounded-t-lg">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {t("dispute_management") || "Dispute Management"}
        </CardTitle>
        {isChatClosed || isTerminal ? (
          <Badge className="bg-red-500/20 text-red-100 hover:bg-red-500/30 border-red-500/50">
            <Lock className="h-3 w-3 mr-1" />
            {t("chat_closed") || "Chat Closed"}
          </Badge>
        ) : (
          <Badge className="bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 border-emerald-500/50">
            <span className="h-2 w-2 rounded-full bg-emerald-400 mr-2"></span>
            {t("chat_open") || "Chat Open"}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Workflow Steps */}
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${discussionDone ? 'bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-950/30 dark:text-emerald-400' : isChatClosed ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-zinc-800' : 'bg-blue-50 text-blue-700 border-blue-400 dark:bg-blue-900/30 dark:text-blue-400'}`}>
            <MessageCircle className="h-4 w-4" />
            {t("step_discussion") || "Discussion"}
          </div>
          <span className="text-muted-foreground">→</span>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${aiDone ? 'bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-950/30 dark:text-emerald-400' : (discussionDone && !isChatClosed ? 'bg-blue-50 text-blue-700 border-blue-400 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-zinc-800')}`}>
            <Bot className="h-4 w-4" />
            {t("step_ai_opinion") || "AI Opinion"}
          </div>
          <span className="text-muted-foreground">→</span>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${decisionDone ? 'bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-950/30 dark:text-emerald-400' : (aiDone && !isTerminal ? 'bg-blue-50 text-blue-700 border-blue-400 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-zinc-800')}`}>
            <Gavel className="h-4 w-4" />
            {t("step_final_decision") || "Final Decision"}
          </div>
        </div>

        <hr />

        {/* Dispute Chat */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("dispute_chat") || "Dispute Chat"}
          </div>
          
          <div className="border rounded-lg overflow-hidden flex flex-col bg-slate-50 dark:bg-zinc-900/50">
            {/* Chat Messages Area */}
            <div 
              ref={chatRef}
              className="p-4 h-[400px] overflow-y-auto flex flex-col gap-4"
            >
              {(!complaint?.chatMessages || complaint.chatMessages.length === 0) ? (
                <div className="text-center text-muted-foreground py-10 my-auto">
                  {t("no_chat_messages") || "No messages yet. Start the conversation."}
                </div>
              ) : (
                complaint.chatMessages.map((msg, idx) => {
                  const role = msg.sender_role || "system";
                  let bgClass = "bg-slate-100 dark:bg-zinc-800";
                  let alignClass = "self-center text-center w-full max-w-full";
                  let roleTextClass = "text-slate-500";
                  let roleLabel = "System";

                  if (role === "store") {
                    bgClass = "bg-teal-50 border-teal-100 dark:bg-teal-900/20 dark:border-teal-900";
                    alignClass = "self-end";
                    roleTextClass = "text-teal-700 dark:text-teal-400";
                    roleLabel = `🏪 ${t("store") || "Store"}`;
                  } else if (role === "customer") {
                    bgClass = "bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900";
                    alignClass = "self-start";
                    roleTextClass = "text-blue-700 dark:text-blue-400";
                    roleLabel = `👤 ${t("customer") || "Customer"}`;
                  } else if (role === "ai") {
                    bgClass = "bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-900";
                    alignClass = "self-center w-full";
                    roleTextClass = "text-purple-700 dark:text-purple-400";
                    roleLabel = `🤖 AI`;
                  }

                  return (
                    <div key={idx} className={`p-3 rounded-xl border max-w-[85%] ${bgClass} ${alignClass}`}>
                      <div className="flex justify-between items-center gap-4 mb-1 text-xs font-bold">
                        <span className={roleTextClass}>
                          {roleLabel} {msg.sender ? `· ${msg.sender.name}` : ""}
                        </span>
                        <span className="text-muted-foreground font-normal">
                          {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                        {msg.body}
                      </div>
                      {msg.attachment && msg.attachment.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {msg.attachment.map((att, i) => (
                            <a key={i} href={att} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-teal-600 hover:underline">
                              <Paperclip className="h-3 w-3" /> Attachment
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            {(!isChatClosed && !isTerminal) ? (
              <div className="border-t bg-white dark:bg-zinc-950 p-3">
                <form onSubmit={handleSend} className="flex gap-2">
                  <textarea
                    className="flex-1 min-h-[44px] max-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
                    placeholder={t("type_message") || "Type your message..."}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                  <Button type="submit" className="bg-teal-600 hover:bg-teal-700 self-end" disabled={sending}>
                    {sending ? <LoadingSpinner className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    {t("send") || "Send"}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="border-t bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-400 p-3 text-center text-sm font-semibold">
                <Lock className="h-4 w-4 inline mr-2" />
                {isTerminal ? (t("complaint_resolved") || "Complaint is resolved/rejected.") : (t("chat_is_closed") || "This chat is closed.")}
              </div>
            )}
          </div>
        </div>

        {/* Workflow Actions */}
        {!isTerminal && (
          <>
            <hr />
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("workflow_actions") || "Workflow Actions"}
              </div>
              <div className="flex flex-wrap gap-3">
                {!discussionDone ? (
                  <Button 
                    onClick={() => {
                      if(window.confirm(t("confirm_discussion_complete") || "Mark discussion as completed? This cannot be undone.")) {
                        onWorkflowAction('discussion_completed');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {t("mark_discussion_complete") || "Mark Discussion Complete"}
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-600 py-2 px-4 text-sm font-semibold bg-emerald-50">
                    {t("discussion_completed") || "Discussion Completed"}
                  </Badge>
                )}

                {(discussionDone && !aiDone) ? (
                  <Button 
                    onClick={() => {
                      if(window.confirm(t("confirm_ai_opinion") || "Request AI opinion? This can only be done once.")) {
                        onWorkflowAction('request_ai_opinion');
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    {t("request_ai_opinion") || "Request AI Opinion"}
                  </Button>
                ) : aiDone ? (
                  <Badge variant="outline" className="text-purple-600 border-purple-600 py-2 px-4 text-sm font-semibold bg-purple-50">
                    <Bot className="h-4 w-4 mr-2" />
                    {t("ai_opinion_generated") || "AI Opinion Generated"}
                  </Badge>
                ) : null}

                {!isChatClosed && (
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      if(window.confirm(t("confirm_close_chat") || "Close the chat immediately? This cannot be undone.")) {
                        onWorkflowAction('close_chat_now');
                      }
                    }}
                  >
                    {t("close_chat_now") || "Close Chat Now"}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Final Decision */}
        {(aiDone && !isTerminal) && (
          <>
            <hr />
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-5">
              <h3 className="text-amber-900 dark:text-amber-500 font-bold text-lg mb-4 flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                {t("make_final_decision") || "Make Final Decision"}
              </h3>
              <form onSubmit={handleFinalDecision} className="space-y-4">
                <select
                  value={finalStatus}
                  onChange={(e) => setFinalStatus(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">— {t("select_decision") || "Select decision"} —</option>
                  <option value="resolved">✅ {t("resolved") || "Resolved"}</option>
                  <option value="rejected">❌ {t("rejected") || "Rejected"}</option>
                </select>
                
                <textarea
                  value={finalNotes}
                  onChange={(e) => setFinalNotes(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
                  placeholder={t("final_notes_placeholder") || "Add final notes for the customer (optional)..."}
                />

                <Button type="submit" variant="destructive" className="w-full sm:w-auto">
                  <Gavel className="h-4 w-4 mr-2" />
                  {t("submit_final_decision") || "Submit Final Decision"}
                </Button>
              </form>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
