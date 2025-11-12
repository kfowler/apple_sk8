;;;; apple-sk8.asd
;;;; ASDF system definition for SK8
;;;; This is a modernized build system for the SK8 project
;;;; Compatible with Clozure CL and SBCL

(asdf:defsystem #:apple-sk8
  :description "SK8 - Apple's multimedia authoring environment"
  :version "1.1"
  :author "Apple Computer, Inc."
  :license "SK8 License (see sk8_license.pdf)"
  :depends-on ()
  :serial t
  :components
  (;; Compatibility layer for MCL and Mac Toolbox
   (:file "compat/package")
   (:file "compat/mcl-compat")
   (:file "compat/toolbox-stubs")

   ;; Core packages
   (:file "Sources/packages")

   ;; Basic utilities (non-Mac-specific)
   ;; Note: Many SK8 files depend on Mac Toolbox and won't load
   ;; This is a minimal build that establishes the package structure
   ))

;; Optional: Define a way to load just the compatibility layer
(asdf:defsystem #:apple-sk8/compat
  :description "Compatibility layer for SK8 on modern Common Lisp"
  :version "1.0"
  :serial t
  :components
  ((:file "compat/package")
   (:file "compat/mcl-compat")
   (:file "compat/toolbox-stubs")))
