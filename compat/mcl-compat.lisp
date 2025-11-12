;;;; mcl-compat.lisp
;;;; MCL compatibility layer for SK8
;;;; Provides stubs and compatibility for MCL-specific functionality

(in-package :ccl)

;;; Global variables used by SK8
;;; Note: Some variables might conflict with CL symbols, so we use
;;; implementation-specific handling

#+sbcl
(eval-when (:compile-toplevel :load-toplevel :execute)
  (sb-ext:unlock-package :common-lisp))

(defvar *warn-if-redefine-kernel* nil
  "MCL compatibility: warn if redefining kernel functions")

(defvar *warn-if-redefine* nil
  "MCL compatibility: warn if redefining functions")

(defvar *save-definitions* t
  "MCL compatibility: save function definitions")

(defvar *record-source-file* t
  "MCL compatibility: record source file information")

(defvar *load-verbose* nil
  "MCL compatibility: verbose loading")

(defvar *save-doc-strings* t
  "MCL compatibility: save documentation strings")

(defvar *fasl-save-local-symbols* t
  "MCL compatibility: save local symbols in fasl files")

(defvar *save-local-symbols* t
  "MCL compatibility: save local symbols")

(defvar *save-fred-window-positions* t
  "MCL compatibility: save Fred editor window positions")

(defvar *verbose-eval-selection* nil
  "MCL compatibility: verbose evaluation of selections")

(defvar *default-menubar* nil
  "MCL compatibility: default menubar")

(defvar *user* nil
  "MCL compatibility: current user")

(defvar *user-initials* nil
  "MCL compatibility: user initials")

(defvar *my-projects* nil
  "MCL compatibility: user's projects")

#+sbcl
(eval-when (:compile-toplevel :load-toplevel :execute)
  (sb-ext:lock-package :common-lisp))

;;; MCL-specific functions

(defun lisp-implementation-short-version ()
  "Return a short version string for the Lisp implementation"
  #+clozure "CCL"
  #+sbcl "SBCL"
  #-(or clozure sbcl) "CL")

(defmacro def-load-pointers (name args &body body)
  "MCL compatibility: define load-time initialization"
  `(eval-when (:load-toplevel :execute)
     (defun ,name ,args ,@body)
     (,name)))

(defmacro def-ccl-pointers (name args &body body)
  "MCL compatibility: define CCL pointers (load-time initialization)"
  `(def-load-pointers ,name ,args ,@body))

(defun menubar ()
  "MCL compatibility: return current menubar (stubbed)"
  nil)

;;; Pathname utilities

(defmacro def-logical-directory (name physical-path)
  "MCL compatibility: define a logical directory (stubbed)"
  `(progn
     (format t "~&; Note: logical directory ~A -> ~A (not implemented)~%" ,name ,physical-path)
     nil))

;;; File utilities

(defun mac-file-write-date (path)
  "Get file write date in Mac format (uses universal time)"
  (file-write-date path))

(defun mac-to-universal-time (mac-time)
  "Convert Mac time to universal time"
  ;; Mac epoch is Jan 1, 1904; Unix epoch is Jan 1, 1970
  ;; Difference is 2082844800 seconds
  (+ mac-time 2082844800))

;;; Record/structure compatibility

(defmacro defrecord (name-and-options &body fields)
  "MCL compatibility: define a record (implemented as defstruct)"
  (let* ((name (if (consp name-and-options)
                   (car name-and-options)
                   name-and-options))
         (options (if (consp name-and-options)
                      (cdr name-and-options)
                      nil))
         (struct-fields (mapcar (lambda (field)
                                   (if (consp field)
                                       (car field)
                                       field))
                                 fields)))
    `(defstruct (,name ,@options)
       ,@struct-fields)))

(defmacro rref (record field)
  "MCL compatibility: reference a record field"
  `(slot-value ,record ',field))

(defmacro href (handle field)
  "MCL compatibility: reference a handle field"
  `(slot-value ,handle ',field))

(defun %null-ptr-p (ptr)
  "Check if a pointer is null (stubbed)"
  (null ptr))

(defun %get-string (handle offset)
  "Get a Pascal string from a handle (stubbed)"
  (declare (ignore handle offset))
  "")

(defun %put-string (handle string offset)
  "Put a Pascal string into a handle (stubbed)"
  (declare (ignore handle string offset))
  nil)

(defmacro parse-accessor (accessor)
  "MCL compatibility: parse a record accessor (stubbed)"
  `(quote ,accessor))

;;; Feature detection

;; Add some features that SK8 code might check for
(eval-when (:compile-toplevel :load-toplevel :execute)
  ;; Don't add :ccl feature if we're on real Clozure CL
  #-clozure
  (pushnew :ccl *features*)

  ;; Platform features
  #+x86-64 (pushnew :x86-64 *features*)
  #+x86 (pushnew :x86 *features*))

(format t "~&; MCL compatibility layer loaded for ~A~%" (lisp-implementation-type))
