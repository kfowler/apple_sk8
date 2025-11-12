;;;; package.lisp
;;;; Package definition for SK8 compatibility layer

(in-package :cl-user)

;; Create a CCL package for MCL compatibility
;; This provides symbols that SK8 code expects from MCL's CCL package
(defpackage #:ccl
  (:use #:common-lisp)
  (:export
   ;; Common MCL/CCL symbols used in SK8
   #:*warn-if-redefine-kernel*
   #:*warn-if-redefine*
   #:*save-definitions*
   #:*record-source-file*
   #:*load-verbose*
   #:*save-doc-strings*
   #:*fasl-save-local-symbols*
   #:*save-local-symbols*
   #:*save-fred-window-positions*
   #:*verbose-eval-selection*
   #:*default-menubar*
   #:*user*
   #:*user-initials*
   #:*my-projects*
   #:lisp-implementation-short-version
   #:def-load-pointers
   #:def-ccl-pointers
   #:require-trap
   #:defrecord
   #:rref
   #:href
   #:%null-ptr-p
   #:%get-string
   #:%put-string
   #:get-resource
   #:delete-resource
   #:add-resource
   #:write-resource
   #:detach-resource
   #:with-open-res-file
   #:with-open-resource-file
   #:current-resource-file
   #:using-resource-file
   #:update-resource-file
   #:mac-file-write-date
   #:mac-to-universal-time
   #:parse-accessor
   #:menubar
   ))

;; Re-export symbols that should be available
(eval-when (:compile-toplevel :load-toplevel :execute)
  (unless (find-package :ccl)
    (error "CCL package was not created properly")))
