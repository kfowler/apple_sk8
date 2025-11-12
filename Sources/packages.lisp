;;;; packages.lisp
;;;; SK8 package definitions for modern Common Lisp
;;;; Extracted and adapted from Real Build P1 Work.lisp

(in-package :cl-user)

;;; MacFrames package - must be defined first as others depend on it
(eval-when (:compile-toplevel :load-toplevel :execute)
  (unless (find-package :macframes)
    (defpackage :macframes
      (:use :ccl :common-lisp)
      (:nicknames :mf)
      (:export
       ;; Export commonly used symbols
       #:*build-in-progress-p*
       #:*ui-package*))))

;;; PS (Project System?) package
(eval-when (:compile-toplevel :load-toplevel :execute)
  (unless (find-package :ps)
    (defpackage :ps
      (:use :ccl :common-lisp :macframes))))

;;; SK8 Project Package
(eval-when (:compile-toplevel :load-toplevel :execute)
  (unless (find-package :sk8)
    (defpackage sk8
      (:use)
      (:import-from "COMMON-LISP" "IN-PACKAGE")
      (:export common-lisp:in-package))))

;;; SK8Script package
(eval-when (:compile-toplevel :load-toplevel :execute)
  (unless (find-package :sk8script)
    (defpackage :sk8script
      (:use :ccl :common-lisp :macframes)
      (:nicknames :ss))))

;;; UI package
(eval-when (:compile-toplevel :load-toplevel :execute)
  (unless (find-package :ui)
    (defpackage ui
      (:use)
      (:import-from "COMMON-LISP" "IN-PACKAGE")
      (:export common-lisp:in-package))))

;;; Graphics System package
(eval-when (:compile-toplevel :load-toplevel :execute)
  (unless (find-package :graphics-system)
    (defpackage :graphics-system
      (:use :ccl :common-lisp)
      (:nicknames :gs))))

;;; Development packages
(eval-when (:compile-toplevel :load-toplevel :execute)
  (unless (find-package :sk8development)
    (defpackage sk8development
      (:use :ccl :common-lisp :macframes :sk8)
      (:nicknames :sk8dev))))

(eval-when (:compile-toplevel :load-toplevel :execute)
  (unless (find-package :uidevelopment)
    (defpackage uidevelopment
      (:use :ccl :common-lisp :macframes :ui)
      (:nicknames :uidev))))

;;; Set up UI package variable
(eval-when (:compile-toplevel :load-toplevel :execute)
  (setf (symbol-value (intern "*UI-PACKAGE*" :macframes))
        (find-package "UI")))

(format t "~&; SK8 packages defined successfully~%")
