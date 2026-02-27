"use client";

import { useState, FormEvent } from "react";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message })
      });
      if (res.ok) {
        setStatus("success");
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label htmlFor="contact-name">
        <span>Name</span>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          disabled={status === "sending"}
        />
      </label>
      <label htmlFor="contact-email">
        <span>Email</span>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={status === "sending"}
        />
      </label>
      <label htmlFor="contact-subject">
        <span>Subject</span>
        <input
          id="contact-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          disabled={status === "sending"}
        />
      </label>
      <label htmlFor="contact-message">
        <span>Message</span>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          disabled={status === "sending"}
        />
      </label>
      {status === "success" && (
        <p className="contact-form-message contact-form-success" role="status">
          Thanks! Your message has been sent. We’ll get back to you soon.
        </p>
      )}
      {status === "error" && (
        <p className="contact-form-message contact-form-error" role="alert">
          Something went wrong. Please try again or email us at abhi@argro.co.
        </p>
      )}
      <button type="submit" className="contact-form-submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
